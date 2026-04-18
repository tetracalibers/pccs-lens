import { JIS_COLORS_BY_GROUP, type ColorFamily } from "$lib/data/jis-colors"

const FALLBACK: [string, string] = ["#cccccc", "#aaaaaa"]

export const pickCheckerboardColors = (familyId: ColorFamily): [string, string] => {
  const colors = JIS_COLORS_BY_GROUP.get(familyId) ?? []
  if (colors.length === 0) return FALLBACK
  if (colors.length === 1) return [colors[0].hex, colors[0].hex]

  const firstIdx = Math.floor(Math.random() * colors.length)
  let secondIdx = Math.floor(Math.random() * (colors.length - 1))
  if (secondIdx >= firstIdx) secondIdx += 1

  return [colors[firstIdx].hex, colors[secondIdx].hex]
}
