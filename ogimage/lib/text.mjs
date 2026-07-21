// テキストの XML エスケープ・概算幅測定・複数行レイアウト（縦位置再センタリング＋自動縮小）。
//
// resvg にはテキスト実測 API が無いため、文字ごとの advance を「全角=1em / 半角=約0.55em」で
// 概算する。ピクセルパーフェクトではないが、2 行に収めて幅超過時に font-size を落とす判断には十分。
// 最終的な見た目はユーザーが PNG を目視確認する前提。

/** @param {string} s */
export const escapeXml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

/**
 * その符号位置が全角（1em 幅相当）とみなせるか。
 * ひらがな・カタカナ・CJK・全角記号・全角英数などを全角として扱う。
 * @param {number} code
 */
const isWide = (code) =>
  (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
  (code >= 0x2e80 && code <= 0x303e) || // CJK Radicals〜CJK 記号・句読点
  (code >= 0x3041 && code <= 0x33ff) || // ひらがな・カタカナ・互換文字ほか
  (code >= 0x3400 && code <= 0x4dbf) || // CJK 拡張 A
  (code >= 0x4e00 && code <= 0x9fff) || // CJK 統合漢字
  (code >= 0xa000 && code <= 0xa4cf) ||
  (code >= 0xac00 && code <= 0xd7a3) || // ハングル音節
  (code >= 0xf900 && code <= 0xfaff) || // CJK 互換漢字
  (code >= 0xfe30 && code <= 0xfe4f) || // CJK 互換形
  (code >= 0xff00 && code <= 0xff60) || // 全角英数・記号
  (code >= 0xffe0 && code <= 0xffe6) || // 全角通貨記号
  (code >= 0x20000 && code <= 0x3ffff) // CJK 拡張 B 以降

/**
 * 1 文字あたりの advance（em 単位の概算）。
 * @param {string} ch
 */
const charEm = (ch) => {
  if (ch === " ") return 0.35
  if (ch === "\t") return 0.35
  const code = ch.codePointAt(0) ?? 0
  if (isWide(code)) return 1.0
  // 半角（ラテン・数字・記号）。細い文字もまとめて概算。
  if (/[il.,:;'!|]/.test(ch)) return 0.3
  if (/[A-Z]/.test(ch)) return 0.62
  return 0.55
}

/**
 * 文字列の em 幅（フォントサイズ非依存の概算）。
 * @param {string} text
 */
export const measureEm = (text) => [...String(text)].reduce((sum, ch) => sum + charEm(ch), 0)

/**
 * 実ピクセル概算幅。letter-spacing は固定 px として（文字間の数だけ）加算する。
 * @param {string} text
 * @param {number} fontSize
 * @param {number} [letterSpacing]
 */
export const measureWidth = (text, fontSize, letterSpacing = 0) => {
  const chars = [...String(text)]
  const gaps = Math.max(0, chars.length - 1)
  return measureEm(text) * fontSize + gaps * letterSpacing
}

/**
 * 複数行タイトルのレイアウトを決める。
 * - 最も広い行が maxWidth を超える場合、収まるように font-size を縮小する。
 * - letter-spacing はデザイン比を保つため font-size と同率でスケールする。
 * - 行のベースラインは、1 行時の視覚中心（baseline）を基準に上下対称へ再センタリングする。
 *
 * @param {string[]} lines
 * @param {{ baseline: number, fontSize: number, maxWidth: number, lineHeightRatio: number, letterSpacing?: number, minFontSize?: number }} opts
 * @returns {{ fontSize: number, letterSpacing: number, baselines: number[] }}
 */
export const layoutLines = (lines, opts) => {
  const {
    baseline,
    fontSize: baseFontSize,
    maxWidth,
    lineHeightRatio,
    letterSpacing = 0,
    minFontSize = 0
  } = opts

  const widestEm = Math.max(...lines.map((l) => measureEm(l)), 0.001)
  // em ベースで収まる font-size を求める（letter-spacing の寄与は小さいので em で近似）。
  let fontSize = Math.min(baseFontSize, maxWidth / widestEm)
  if (minFontSize > 0) fontSize = Math.max(fontSize, minFontSize)

  const scaledLetterSpacing = letterSpacing * (fontSize / baseFontSize)
  const lineHeight = fontSize * lineHeightRatio
  const n = lines.length
  const firstBaseline = baseline - ((n - 1) * lineHeight) / 2
  const baselines = lines.map((_, i) => firstBaseline + i * lineHeight)

  return { fontSize, letterSpacing: scaledLetterSpacing, baselines }
}

/** 数値を SVG 属性用に丸める（小数 2 桁）。 */
export const round = (n) => Math.round(n * 100) / 100
