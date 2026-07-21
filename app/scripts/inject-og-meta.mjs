// ビルド後注入スクリプト：build/**/*.html の <head> に og / twitter メタタグを静的注入する。
//
// SNS クローラ（JS 非実行）に全ページの OGP を見せるため、プリレンダ済みの静的 HTML へ
// ビルド後にメタタグを焼き込む。ランタイム（CF Worker / Node サーバ）に依存しない。
//
// 単一の情報源はマニフェスト（src/lib/meta/og-manifest.json）。解決ロジックは og-resolve.js を
// アプリと共有し、マニフェスト未登録のルートは既定画像（ogp/default.png）＋サイト名にフォールバックする。
//
// 実行：node scripts/inject-og-meta.mjs（npm run build の後段で走らせる）

import { readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { resolveOgMetaForKey, SITE_NAME } from "../src/lib/meta/og-resolve.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(__dirname, "..")
const BUILD_DIR = join(APP_ROOT, "build")
const MANIFEST_PATH = join(APP_ROOT, "src/lib/meta/og-manifest.json")

/**
 * HTML 属性値のエスケープ（" と & と < > を実体参照化）。
 * @param {string} value
 * @returns {string}
 */
const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

/**
 * build 配下の HTML ファイルパス → ルートキー（先頭/末尾スラッシュ無し。トップと 404 は ""）。
 * @param {string} htmlPath 絶対パス
 * @returns {string}
 */
const routeKeyFromHtmlPath = (htmlPath) => {
  const rel = relative(BUILD_DIR, htmlPath).split(sep).join("/")
  // 404.html は「真に存在しない URL 用」フォールバック → 既定（サイト名）扱い。
  if (rel === "404.html") return ""
  if (rel === "index.html") return ""
  if (rel.endsWith("/index.html")) return rel.slice(0, -"/index.html".length)
  // 想定外の .html（フォールバック）。拡張子を落としてキー扱い（未登録なら既定に落ちる）。
  return rel.replace(/\.html$/, "")
}

/**
 * 注入する og / twitter メタタグ列（現行 SiteMeta と同一セット）。
 * @param {import("../src/lib/meta/og-resolve.js").ResolvedOgMeta} meta
 * @returns {string}
 */
const buildOgTags = (meta) =>
  [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `<meta property="og:url" content="${escapeAttr(meta.url)}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:image" content="${escapeAttr(meta.imageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeAttr(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`
  ].join("\n    ")

/**
 * ディレクトリ配下の *.html を再帰的に列挙する。
 * @param {string} dir
 * @returns {AsyncGenerator<string>}
 */
async function* walkHtml(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const full = join(dir, dirent.name)
    if (dirent.isDirectory()) yield* walkHtml(full)
    else if (dirent.name.endsWith(".html")) yield full
  }
}

const main = async () => {
  /** @type {{ routes: Record<string, { title: string }> }} */
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
  const routes = manifest.routes ?? {}

  let processed = 0
  let injected = 0
  let skipped = 0

  for await (const htmlPath of walkHtml(BUILD_DIR)) {
    processed += 1
    const html = await readFile(htmlPath, "utf8")

    // 冪等性：既に og: タグがあるファイルは二重挿入しない。
    if (html.includes('property="og:')) {
      skipped += 1
      continue
    }

    const closeHead = html.indexOf("</head>")
    if (closeHead === -1) {
      console.warn(`[inject-og-meta] </head> が見つかりません: ${relative(BUILD_DIR, htmlPath)}`)
      skipped += 1
      continue
    }

    const key = routeKeyFromHtmlPath(htmlPath)
    const meta = resolveOgMetaForKey(key, routes)
    const tags = buildOgTags(meta)

    const next = `${html.slice(0, closeHead)}    ${tags}\n  ${html.slice(closeHead)}`
    await writeFile(htmlPath, next, "utf8")
    injected += 1
  }

  console.log(
    `[inject-og-meta] 対象 ${processed} / 注入 ${injected} / スキップ ${skipped}（og: 既出 or </head> なし）`
  )
}

main().catch((err) => {
  console.error("[inject-og-meta] 失敗:", err)
  process.exit(1)
})
