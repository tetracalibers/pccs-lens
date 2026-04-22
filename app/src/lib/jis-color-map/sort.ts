import { munsellHueRank, parseMunsell } from "$lib/color/munsell"
import type { JISColor } from "$lib/data/jis-colors"

type ChromaticEntry = {
  color: JISColor
  hueRank: number
  value: number
  chroma: number
}

type NeutralEntry = {
  color: JISColor
  value: number
}

/**
 * 慣用色の配列をマンセル色相順（起点 2RP）でソートして返す。
 * - 有彩色: 色相ランク昇順 → 明度降順 → 彩度降順
 * - 無彩色（`N` で始まるもの）: 有彩色の末尾に配置し、明度降順
 * - `parseMunsell` / `munsellHueRank` が `null` を返す不正値は末尾に退避する
 */
export const sortJisColors = (colors: JISColor[]): JISColor[] => {
  const chromatic: ChromaticEntry[] = []
  const neutrals: NeutralEntry[] = []
  const invalid: JISColor[] = []

  for (const color of colors) {
    const parsed = parseMunsell(color.munsell)
    if (parsed === null) {
      invalid.push(color)
      continue
    }
    if (parsed.isNeutral) {
      neutrals.push({ color, value: parsed.value })
      continue
    }
    const hueRank = munsellHueRank(parsed.hue)
    if (hueRank === null) {
      invalid.push(color)
      continue
    }
    chromatic.push({ color, hueRank, value: parsed.value, chroma: parsed.chroma })
  }

  chromatic.sort((a, b) => {
    if (a.hueRank !== b.hueRank) return a.hueRank - b.hueRank
    if (a.value !== b.value) return b.value - a.value
    return b.chroma - a.chroma
  })

  neutrals.sort((a, b) => b.value - a.value)

  return [...chromatic.map((e) => e.color), ...neutrals.map((e) => e.color), ...invalid]
}
