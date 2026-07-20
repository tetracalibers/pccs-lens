#!/usr/bin/env node
// OGP 画像 描画スクリプト（描画＋簿記）。
//
// スキル（知能層）が解決した「確定値」を JSON で受け取り、テンプレート SVG に流し込んで
// resvg-js で PNG 化する。加えて、確定値の記録（ogimage/data/<route>.json）と図版の永続コピー
// （ogimage/data/assets/<route>/）という簿記を担う唯一の書き手。ページ探索・メタ抽出・改行判断は行わない。
//
// 使い方（リポジトリのルートから実行することを想定）:
//   node ogimage/render.mjs --json '<JSON>'
//   node ogimage/render.mjs --input payload.json
//   echo '<JSON>' | node ogimage/render.mjs
//
// JSON は単一オブジェクト、配列、または { items: [...] } を受け付ける（一括生成対応）。
// 単発・部分生成なので、全件検証してから描画する fail-fast（1 件でも不正なら描画前に停止）。
// 記録のある全ページの「一括再生成」は regenerate.mjs（robust）を使う。
//
// 1 件分の JSON（例）:
//   {
//     "variation": "nested",                         // default | title-only | nested | nested-fig
//     "route": "color-theory/pccs-basics",           // 記録・マニフェスト用キー & 既定の出力パス算出に使う
//     "title": "PCCSと色の分類",                       // og:title 用の完全なタイトル（改行なし）
//     "titleLines": ["PCCSと", "色の分類"],            // 描画用の改行済みタイトル（default 以外で必須）
//     "crumbs": ["色を学ぶ", "色の理論"],               // nested / nested-fig で必須
//     "figure": "tmp/pccs-fig.png",                  // nested-fig で必須（手渡し画像のパス。data/assets へコピーされる）
//     "out": "app/static/ogp/color-theory/pccs-basics.png"  // 省略時は route から算出
//   }
//
// オプション:
//   --manifest <path>   マニフェストの出力先を上書き
//   --no-manifest       マニフェストを更新しない
//   --data <dir>        記録・図版アセットの保存先（既定: ogimage/data）を上書き
//   --no-record         記録を書き込まない（描画のみ）
//   --fonts <dir>       フォントディレクトリを上書き

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { buildFontOptions } from "./lib/fonts.mjs"
import { upsertManifest } from "./lib/manifest.mjs"
import {
  DEFAULT_DATA_DIR,
  DEFAULT_FONTS_DIR,
  DEFAULT_MANIFEST,
  prepareItem,
  renderPrepared,
  resolveFromCwd
} from "./lib/render-core.mjs"

/** コマンドライン引数を素朴にパースする。 */
const parseArgs = (argv) => {
  const opts = { json: null, input: null, manifest: null, noManifest: false, data: null, noRecord: false, fonts: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") opts.json = argv[++i]
    else if (a === "--input") opts.input = argv[++i]
    else if (a === "--manifest") opts.manifest = argv[++i]
    else if (a === "--no-manifest") opts.noManifest = true
    else if (a === "--data") opts.data = argv[++i]
    else if (a === "--no-record") opts.noRecord = true
    else if (a === "--fonts") opts.fonts = argv[++i]
    else throw new Error(`不明な引数: ${a}`)
  }
  return opts
}

/** 入力 JSON テキストを取得する（--json / --input / 標準入力）。 */
const readPayload = (opts) => {
  if (opts.json != null) return opts.json
  if (opts.input != null) return readFileSync(resolve(process.cwd(), opts.input), "utf8")
  // 標準入力（パイプ）から読む
  try {
    return readFileSync(0, "utf8")
  } catch {
    return ""
  }
}

/** payload を 1 件配列に正規化する。 */
const normalizeItems = (raw) => {
  const data = JSON.parse(raw)
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  return [data]
}

const main = () => {
  const opts = parseArgs(process.argv.slice(2))
  const raw = readPayload(opts)
  if (!raw || !raw.trim()) {
    throw new Error("入力 JSON がありません。--json / --input / 標準入力 のいずれかで渡してください。")
  }

  const items = normalizeItems(raw)
  const fontsDir = opts.fonts ? resolveFromCwd(opts.fonts) : DEFAULT_FONTS_DIR
  const fontOptions = buildFontOptions(fontsDir)
  if (fontOptions.fontFiles.length === 0) {
    console.warn(
      `⚠ フォントが見つかりません: ${fontsDir}\n  日本語などが正しく描画されません。'npm run fonts' でフォントを取得してください。`
    )
  }
  const ctx = {
    fontOptions,
    dataDir: opts.data ? resolveFromCwd(opts.data) : DEFAULT_DATA_DIR,
    noRecord: opts.noRecord
  }
  const manifestPath = opts.manifest ? resolveFromCwd(opts.manifest) : DEFAULT_MANIFEST

  const prepared = items.map(prepareItem) // 先に全件検証（1 件でも不正なら描画前に停止）
  const results = []
  for (const p of prepared) {
    results.push(renderPrepared(p, ctx))
    console.log(`✓ ${p.variation.padEnd(10)} → ${p.out}${p.key ? `  (route: ${p.key})` : ""}`)
  }

  // マニフェスト更新（単発・部分は upsert＝対象外ページの項目を消さない）
  if (!opts.noManifest) {
    for (const r of results) {
      if (r.key && r.variation !== "default") upsertManifest(manifestPath, r.key, { title: r.title })
    }
  }

  console.log(`\n完了: ${prepared.length} 件`)
}

try {
  main()
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}
