/** 背景は白で固定。パレットの色は模様にだけ使い、背景には使わない */
export const BACKGROUND = '#FFFFFF'

/**
 * 既定パレットの元になる色。
 * インデックスが小さいほど使用面積が大きくなる順に並べる。
 * 色数 k のパレットは先頭 k 色を取り出したものなので、
 * 色数を増やすと色が入れ替わらずに積み上がり、色数どうしを比較しやすい。
 */
const MASTER = [
  '#E2C48A', // 淡い黄土
  '#2B4257', // 濃紺
  '#D2694A', // テラコッタ
  '#7FA08F', // セージ
  '#8A6A99', // 藤紫
  '#4E8FA6', // 青緑
]

export const COLOR_COUNTS = [2, 3, 4, 5, 6]

export const DEFAULT_PALETTES = Object.fromEntries(
  COLOR_COUNTS.map((k) => [k, MASTER.slice(0, k)]),
)

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
