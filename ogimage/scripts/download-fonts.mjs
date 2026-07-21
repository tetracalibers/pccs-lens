#!/usr/bin/env node
// OGP テンプレートで使うフォント実体を ogimage/fonts/ に取得する（すべて Google Fonts / OFL）。
//
//  取得するのはテンプレートが実際に使うウェイトのみ:
//    Zen Kaku Gothic New 500(タグライン/crumb 日本語部分)・700(タイトル)、SUSE Mono 500(英字ロゴ)、
//    Reddit Mono 500(crumb ラテン部分)。
//
//  - Zen Kaku Gothic New（日本語）… 完全版の静的 TTF が必要（css2 の subset だと日本語カバレッジが
//    欠ける）ため、google/fonts のミラー(jsDelivr)から取得。
//  - SUSE Mono / Reddit Mono … 可変フォントで配布されており、resvg は可変フォントのウェイト選択を
//    解決できない（既定インスタンス＝細字で描画される）。そこで Fontsource の「ウェイト確定済み静的
//    インスタンス（woff2）」を取得し、wawoff2 で TTF へ展開する（resvg は woff2 を読めない）。
//    さらに Fontsource の静的インスタンスはファミリー名に既定インスタンス名が混入している
//    （例: "SUSE Mono Thin" / "Reddit Mono Medium"）ため、font-family でマッチせずフォールバックする。
//    name テーブルを "SUSE Mono" / "Reddit Mono" に正規化して保存する（ウェイト＝OS/2 は保持）。
//    同じ理由で Zen Kaku Gothic New の Medium(500) も "Zen Kaku Gothic New" に正規化する。
//
//   実行: npm run fonts   （= node scripts/download-fonts.mjs）

import { mkdirSync, writeFileSync, existsSync, statSync, readdirSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { decompress } from "wawoff2"
import { renameFontFamily } from "../lib/rename-font.mjs"

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

/** TTF を保存。renameTo 指定時は name テーブルのファミリー名を正規化する。 */
const save = (name, buf, renameTo) => {
  const out = renameTo ? renameFontFamily(buf, renameTo) : buf
  writeFileSync(join(FONTS_DIR, name), out)
  console.log(
    `  ✓ ${name}  (${(out.length / 1024).toFixed(0)} KB)${renameTo ? ` [family="${renameTo}"]` : ""}`
  )
}

/** google/fonts ミラーから完全版 静的 TTF を取得。 */
const fetchGoogleStatic = async (name, repoPath, renameTo) => {
  const buf = await fetchBuffer(GF_MIRROR + repoPath)
  if (buf) save(name, buf, renameTo)
}

/** Fontsource の静的インスタンス woff2 を取得し、TTF に展開・ファミリー名を正規化して保存。 */
const fetchFontsourceTtf = async (pkg, subset, weight, outName, renameTo) => {
  const url = `${FONTSOURCE}${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`
  const woff2 = await fetchBuffer(url)
  if (!woff2) return
  const ttf = Buffer.from(await decompress(woff2))
  save(outName, ttf, renameTo)
}

const main = async () => {
  mkdirSync(FONTS_DIR, { recursive: true })
  // 生成物だけを残すため、既存のフォントを一度クリアする（旧ウェイトの残留を防ぐ）。
  for (const f of readdirSync(FONTS_DIR).filter((f) => /\.(ttf|otf)$/i.test(f))) {
    rmSync(join(FONTS_DIR, f))
  }

  console.log("Zen Kaku Gothic New (500/700) — 完全版 静的 TTF")
  // Medium はファミリー名が "Zen Kaku Gothic New Medium" なので正規化する
  await fetchGoogleStatic(
    "ZenKakuGothicNew-Medium.ttf",
    "ofl/zenkakugothicnew/ZenKakuGothicNew-Medium.ttf",
    "Zen Kaku Gothic New"
  )
  await fetchGoogleStatic(
    "ZenKakuGothicNew-Bold.ttf",
    "ofl/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf"
  )

  console.log("\nSUSE Mono (500) — 英字ロゴ / Fontsource 静的インスタンス→TTF→ファミリー名正規化")
  await fetchFontsourceTtf("suse-mono", "latin", 500, "SUSEMono-500.ttf", "SUSE Mono")

  console.log(
    "\nReddit Mono (500) — crumb ラテン部分 / Fontsource 静的インスタンス→TTF→ファミリー名正規化"
  )
  await fetchFontsourceTtf("reddit-mono", "latin", 500, "RedditMono-500.ttf", "Reddit Mono")

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
