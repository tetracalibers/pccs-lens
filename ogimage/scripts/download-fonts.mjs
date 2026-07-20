#!/usr/bin/env node
// OGP テンプレートで使うフォント実体を ogimage/fonts/ に取得する（すべて Google Fonts / OFL）。
//
//  - Zen Kaku Gothic New（日本語・タイトル/crumb 日本語部分）… 完全版の静的 TTF が必要
//    （css2 の subset だと日本語のカバレッジが欠ける）ため、google/fonts のミラー(jsDelivr)から取得。
//  - SUSE Mono（英字ロゴ・800）/ Reddit Mono（crumb ラテン部分・500）… これらは可変フォントで
//    配布されており、resvg は可変フォントのウェイト選択を解決できない（既定インスタンス＝細字で描画される）。
//    そこで Fontsource が配布する「ウェイト確定済みの静的インスタンス（woff2）」を取得し、
//    wawoff2 で TTF へ展開して保存する（resvg は woff2 を読めないため TTF 化が必須）。
//
//   実行: npm run fonts   （= node scripts/download-fonts.mjs）

import { mkdirSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { decompress } from "wawoff2"

const HERE = dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = join(HERE, "..", "fonts")

const GF_MIRROR = "https://cdn.jsdelivr.net/gh/google/fonts@main/"
const FONTSOURCE = "https://cdn.jsdelivr.net/npm/@fontsource/"

/** バイナリ取得。失敗で null。 */
const fetchBuffer = async (url) => {
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) {
    console.warn(`  ✗ ${res.status} ${url}`)
    return null
  }
  return Buffer.from(await res.arrayBuffer())
}

const save = (name, buf) => {
  writeFileSync(join(FONTS_DIR, name), buf)
  console.log(`  ✓ ${name}  (${(buf.length / 1024).toFixed(0)} KB)`)
}

/** google/fonts ミラーから完全版 静的 TTF を取得。 */
const fetchGoogleStatic = async (name, repoPath) => {
  const buf = await fetchBuffer(GF_MIRROR + repoPath)
  if (buf) save(name, buf)
}

/** Fontsource の静的インスタンス woff2 を取得し、TTF に展開して保存。 */
const fetchFontsourceTtf = async (pkg, subset, weight, outName) => {
  const url = `${FONTSOURCE}${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`
  const woff2 = await fetchBuffer(url)
  if (!woff2) return
  const ttf = Buffer.from(await decompress(woff2))
  save(outName, ttf)
}

const main = async () => {
  mkdirSync(FONTS_DIR, { recursive: true })

  console.log("Zen Kaku Gothic New (400/500/700) — 完全版 静的 TTF")
  await fetchGoogleStatic(
    "ZenKakuGothicNew-Regular.ttf",
    "ofl/zenkakugothicnew/ZenKakuGothicNew-Regular.ttf"
  )
  await fetchGoogleStatic(
    "ZenKakuGothicNew-Medium.ttf",
    "ofl/zenkakugothicnew/ZenKakuGothicNew-Medium.ttf"
  )
  await fetchGoogleStatic(
    "ZenKakuGothicNew-Bold.ttf",
    "ofl/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf"
  )

  console.log("\nSUSE Mono (800) — 英字ロゴ / Fontsource 静的インスタンス→TTF")
  await fetchFontsourceTtf("suse-mono", "latin", 800, "SUSEMono-800.ttf")

  console.log("\nReddit Mono (500) — crumb ラテン部分 / Fontsource 静的インスタンス→TTF")
  await fetchFontsourceTtf("reddit-mono", "latin", 500, "RedditMono-500.ttf")

  const files = existsSync(FONTS_DIR)
    ? readdirSync(FONTS_DIR).filter((f) => /\.(ttf|otf)$/i.test(f))
    : []
  console.log(`\n取得完了: ${files.length} ファイル`)
  for (const f of files) {
    const kb = (statSync(join(FONTS_DIR, f)).size / 1024).toFixed(0)
    console.log(`  - ${f}  (${kb} KB)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
