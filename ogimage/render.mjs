#!/usr/bin/env node
// OGP 画像 描画スクリプト（描画専用）。
//
// スキル（知能層）が解決した「確定値」を JSON で受け取り、テンプレート SVG に流し込んで
// resvg-js で PNG 化するだけ。ページ探索・メタ抽出・改行判断などは一切行わない。
//
// 使い方（リポジトリのルートから実行することを想定）:
//   node ogimage/render.mjs --json '<JSON>'
//   node ogimage/render.mjs --input payload.json
//   echo '<JSON>' | node ogimage/render.mjs
//
// JSON は単一オブジェクト、配列、または { items: [...] } を受け付ける（一括生成対応）。
//
// 1 件分の JSON（例）:
//   {
//     "variation": "nested",                         // default | title-only | nested | nested-fig
//     "route": "color-theory/pccs-basics",           // マニフェスト用キー & 既定の出力パス算出に使う
//     "title": "PCCSと色の分類",                       // og:title 用の完全なタイトル（改行なし）
//     "titleLines": ["PCCSと", "色の分類"],            // 描画用の改行済みタイトル（default 以外で必須）
//     "crumbs": ["色を学ぶ", "色の理論"],               // nested / nested-fig で必須
//     "figure": "tmp/pccs-fig.png",                  // nested-fig で必須（手渡し画像のパス）
//     "out": "app/static/ogp/color-theory/pccs-basics.png"  // 省略時は route から算出
//   }
//
// オプション:
//   --manifest <path>   マニフェストの出力先を上書き
//   --no-manifest       マニフェストを更新しない
//   --fonts <dir>       フォントディレクトリを上書き

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join, resolve, isAbsolute } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { fillTemplate } from "./lib/build-svg.mjs"
import { buildFontOptions } from "./lib/fonts.mjs"
import { upsertManifest } from "./lib/manifest.mjs"
import { routeKey } from "./config.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, "..")
const TEMPLATE_DIR = join(HERE, "template")
const DEFAULT_FONTS_DIR = join(HERE, "fonts")
const DEFAULT_MANIFEST = join(REPO_ROOT, "app/src/lib/meta/og-manifest.json")
const DEFAULT_OUT_DIR = join(REPO_ROOT, "app/static/ogp")

const VARIATIONS = new Set(["default", "title-only", "nested", "nested-fig"])

/** コマンドライン引数を素朴にパースする。 */
const parseArgs = (argv) => {
  const opts = { json: null, input: null, manifest: null, noManifest: false, fonts: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") opts.json = argv[++i]
    else if (a === "--input") opts.input = argv[++i]
    else if (a === "--manifest") opts.manifest = argv[++i]
    else if (a === "--no-manifest") opts.noManifest = true
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

/** 相対パスはリポジトリのルートではなく実行時 cwd 基準で解決する（ユーザーが渡すパス向け）。 */
const resolveFromCwd = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p))

/** 1 件を検証し、描画に必要な値へ整形する。 */
const prepareItem = (item) => {
  const variation = item.variation
  if (!VARIATIONS.has(variation)) {
    throw new Error(`variation が不正です: ${JSON.stringify(variation)}（default|title-only|nested|nested-fig）`)
  }

  const key = item.route != null ? routeKey(item.route) : ""

  // 出力先
  let out
  if (item.out) out = resolveFromCwd(item.out)
  else if (key) out = join(DEFAULT_OUT_DIR, `${key}.png`)
  else throw new Error(`out も route も無いため出力先を決められません（variation=${variation}）`)

  const title = item.title ?? (Array.isArray(item.titleLines) ? item.titleLines.join("") : "")
  const titleLines =
    Array.isArray(item.titleLines) && item.titleLines.length > 0
      ? item.titleLines
      : title
        ? [title]
        : []

  if (variation !== "default" && titleLines.length === 0) {
    throw new Error(`title / titleLines が必要です（variation=${variation}, route=${item.route ?? "?"}）`)
  }
  if (titleLines.length > 2) {
    throw new Error(`タイトルは最大 2 行です（${titleLines.length} 行が渡されました, route=${item.route ?? "?"}）`)
  }

  const needsCrumbs = variation === "nested" || variation === "nested-fig"
  const crumbs = Array.isArray(item.crumbs) ? item.crumbs : []
  if (needsCrumbs && crumbs.length === 0) {
    throw new Error(`crumbs が必要です（variation=${variation}, route=${item.route ?? "?"}）`)
  }

  let figure
  if (variation === "nested-fig") {
    if (!item.figure) throw new Error(`nested-fig には figure（図版パス）が必要です（route=${item.route ?? "?"}）`)
    figure = resolveFromCwd(item.figure)
    if (!existsSync(figure)) throw new Error(`図版ファイルが見つかりません: ${figure}`)
  }

  return { variation, key, out, title, titleLines, crumbs, figure }
}

const renderOne = (prepared, ctx) => {
  const templatePath = join(TEMPLATE_DIR, `${prepared.variation}.svg`)
  const template = readFileSync(templatePath, "utf8")
  const svg = fillTemplate(template, prepared.variation, {
    titleLines: prepared.titleLines,
    crumbs: prepared.crumbs,
    figure: prepared.figure
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: ctx.fontOptions,
    background: "#ffffff"
  })
  const png = resvg.render().asPng()

  mkdirSync(dirname(prepared.out), { recursive: true })
  writeFileSync(prepared.out, png)

  // マニフェスト更新（route があり、default 以外のとき）
  if (!ctx.noManifest && prepared.key && prepared.variation !== "default") {
    upsertManifest(ctx.manifestPath, prepared.key, { title: prepared.title })
  }
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
    noManifest: opts.noManifest,
    manifestPath: opts.manifest ? resolveFromCwd(opts.manifest) : DEFAULT_MANIFEST
  }

  const prepared = items.map(prepareItem) // 先に全件検証（1 件でも不正なら描画前に停止）
  for (const p of prepared) {
    renderOne(p, ctx)
    console.log(`✓ ${p.variation.padEnd(10)} → ${p.out}${p.key ? `  (route: ${p.key})` : ""}`)
  }
  console.log(`\n完了: ${prepared.length} 件`)
}

try {
  main()
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}
