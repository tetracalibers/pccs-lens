// ogimage/fonts/ にコミットされたフォント実体を集めて resvg に渡すためのヘルパ。
// システムフォントは使わない（環境差で描画が変わらないようにする）。

import { existsSync, readdirSync } from "node:fs"
import { join, extname } from "node:path"

const FONT_EXTS = new Set([".ttf", ".otf", ".ttc", ".woff2", ".woff"])

/**
 * fonts ディレクトリ内のフォントファイル絶対パス一覧を返す。
 * @param {string} fontsDir
 * @returns {string[]}
 */
export const collectFontFiles = (fontsDir) => {
  if (!existsSync(fontsDir)) return []
  return readdirSync(fontsDir)
    .filter((name) => FONT_EXTS.has(extname(name).toLowerCase()))
    .map((name) => join(fontsDir, name))
    .sort()
}

/**
 * resvg に渡す font オプションを組み立てる。
 * @param {string} fontsDir
 */
export const buildFontOptions = (fontsDir) => {
  const fontFiles = collectFontFiles(fontsDir)
  return {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: "Zen Kaku Gothic New",
    sansSerifFamily: "Zen Kaku Gothic New",
    serifFamily: "Zen Kaku Gothic New",
    monospaceFamily: "Reddit Mono"
  }
}
