/**
 * 既定パレット。
 * インデックスが小さいほど使用面積が大きくなる順に並べる（[0] は背景色）。
 */
export const DEFAULT_PALETTES = {
  2: ['#F2EDE4', '#233B57'],
  3: ['#F4EFE6', '#1F4E5F', '#D96B4A'],
  4: ['#F5F0E6', '#2C4A63', '#D8763E', '#8FB0A3'],
  5: ['#F6F1E7', '#27414F', '#C9563C', '#E2A93B', '#7FA396'],
  6: ['#F7F2E8', '#2B3F55', '#B94E3D', '#E0A63C', '#6E9B86', '#8C6E9B'],
}

export const COLOR_COUNTS = [2, 3, 4, 5, 6]

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function parsePalette(text) {
  const colors = text
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
  const invalid = colors.filter((c) => !HEX.test(c))
  if (invalid.length > 0) {
    throw new Error(`不正な HEX カラーコード: ${invalid.join(', ')}`)
  }
  if (colors.length < 2 || colors.length > 6) {
    throw new Error(`色数は 2〜6 で指定してください（指定: ${colors.length}）`)
  }
  return colors
}
