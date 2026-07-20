#!/usr/bin/env node
// OGP 画像 一括再生成スクリプト（描画専用の自動化）。
//
// ogimage/data/**/*.json の記録を読み、route からバリエーションを config.mjs で再解決して、
// 描画コア（render-core.mjs）の一括経路に流すだけ。対話・コード走査・メタ抽出は一切しない
// （＝知能不要）。テンプレートをリデザインしたあと、記録のある全ページを対話ゼロで作り直す用途。
//
// 使い方（リポジトリのルート、または ogimage/ から）:
//   node ogimage/regenerate.mjs                 記録のある全ページ + default.png（マニフェストは rebuild）
//   node ogimage/regenerate.mjs '/color-theory/*'   glob で部分再生成（マニフェストは upsert）
//   npm run regenerate -- '/color-theory/*'     npm 経由（引数の前に -- が必要）
//
// バリエーションは記録に持たず、route から config.mjs の resolveVariation で毎回引き直す
// （figure の有無で optional → nested-fig を昇格）。バリエーション規則の変更が全再生成に一貫して効く。
//
// 頑健モード: per-page でエラーを握って続行し、最後に「成功 N 件 / 失敗 M 件 ＋ 失敗一覧」を報告する。
// 1 ページの不備で全体を止めない（単発の render.mjs は逆に fail-fast）。

import { join } from "node:path"
import picomatch from "picomatch"
import { normalizeRoute, resolveVariation } from "./config.mjs"
import { buildFontOptions } from "./lib/fonts.mjs"
import { rebuildManifest, upsertManifest } from "./lib/manifest.mjs"
import { listRecords, resolveFigureFromData } from "./lib/record.mjs"
import {
  DEFAULT_DATA_DIR,
  DEFAULT_FONTS_DIR,
  DEFAULT_MANIFEST,
  DEFAULT_OUT_DIR,
  prepareItem,
  renderPrepared
} from "./lib/render-core.mjs"

/** glob 引数を先頭スラッシュ付きに正規化する（記録キーは "/route" で照合するため）。 */
const ensureLead = (g) => (g.startsWith("/") ? g : `/${g}`)

const main = () => {
  const globArg = process.argv[2] ?? null // 省略時は全再生成
  const isFull = globArg == null
  const pattern = globArg ? ensureLead(globArg) : null

  const fontOptions = buildFontOptions(DEFAULT_FONTS_DIR)
  if (fontOptions.fontFiles.length === 0) {
    console.warn(
      `⚠ フォントが見つかりません: ${DEFAULT_FONTS_DIR}\n  日本語などが正しく描画されません。'npm run fonts' でフォントを取得してください。`
    )
  }
  const ctx = { fontOptions, dataDir: DEFAULT_DATA_DIR }

  const all = listRecords(DEFAULT_DATA_DIR)
  const selected = pattern
    ? all.filter(({ key }) => picomatch.isMatch(normalizeRoute(key), pattern))
    : all

  if (all.length === 0) {
    console.warn(`記録がありません: ${DEFAULT_DATA_DIR}（スキルで初回生成すると記録が書かれます）`)
  } else if (pattern && selected.length === 0) {
    console.warn(`glob '${pattern}' に一致する記録がありません。`)
  }

  const succeeded = []
  const failed = []

  for (const { key, record, path, error } of selected) {
    try {
      if (!record) throw new Error(`記録の読み込みに失敗しました: ${path}${error ? `（${error.message}）` : ""}`)
      const variation = resolveVariation(key, { hasFigure: Boolean(record.figure) })
      if (!variation) throw new Error(`config.mjs に該当する規則がありません（削除/リネーム済みルート?）`)

      const prepared = prepareItem({
        variation,
        route: record.route ?? key,
        title: record.title,
        titleLines: record.titleLines,
        crumbs: record.crumbs ?? [],
        figure: record.figure ? resolveFigureFromData(ctx.dataDir, record.figure) : undefined
      })
      renderPrepared(prepared, ctx)
      succeeded.push({ key, title: prepared.title, variation })
      console.log(`✓ ${variation.padEnd(10)} → ${prepared.out}  (route: ${key})`)
    } catch (err) {
      failed.push({ key, message: err instanceof Error ? err.message : String(err) })
      console.error(`✗ ${key}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 全再生成のときだけ default.png も無条件生成する。
  if (isFull) {
    try {
      const prepared = prepareItem({ variation: "default", out: join(DEFAULT_OUT_DIR, "default.png") })
      renderPrepared(prepared, ctx)
      console.log(`✓ ${"default".padEnd(10)} → ${prepared.out}`)
    } catch (err) {
      failed.push({ key: "(default)", message: err instanceof Error ? err.message : String(err) })
      console.error(`✗ (default): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // マニフェスト: 全再生成は記録の全集合から rebuild（削除ページを自己修復で落とす）。
  //             部分再生成は成功分のみ upsert（対象外ページの項目を消さない）。
  if (isFull) {
    const entries = all
      .filter(({ record }) => record && record.title != null)
      .map(({ key, record }) => ({ key, title: record.title }))
    rebuildManifest(DEFAULT_MANIFEST, entries)
  } else {
    for (const r of succeeded) {
      if (r.key && r.variation !== "default") upsertManifest(DEFAULT_MANIFEST, r.key, { title: r.title })
    }
  }

  console.log(`\n完了: 成功 ${succeeded.length} 件 / 失敗 ${failed.length} 件`)
  if (failed.length > 0) {
    console.log("失敗一覧:")
    for (const f of failed) console.log(`  - ${f.key}: ${f.message}`)
    process.exitCode = 1
  }
}

try {
  main()
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}
