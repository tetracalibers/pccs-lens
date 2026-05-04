import munsellHueJson from "./munsell_hue.json"

/** Munsell表色系の10色相族（時計回り） */
export const MUNSELL_HUE_FAMILIES = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"] as const

export type MunsellHueFamily = (typeof MUNSELL_HUE_FAMILIES)[number]

/** "1R", "2R", ..., "10R", "1YR", ..., "10RP" の形式の100色相表記 */
export type MunsellHueLabel = string

/** Munsell 100色相 → HEXコード（明度5・彩度10相当の代表色） */
export const MUNSELL_HUE_HEX: Record<MunsellHueLabel, string> = munsellHueJson

export const MUNSELL_HUE_HEX_MAP: Map<MunsellHueLabel, string> = new Map(
  Object.entries(munsellHueJson)
)

/** 0..99 のインデックス → 色相表記（idx 0 = "1R", idx 99 = "10RP"） */
export const munsellHueLabelAt = (idx: number): MunsellHueLabel => {
  const num = (idx % 10) + 1
  const fam = MUNSELL_HUE_FAMILIES[Math.floor(idx / 10)]
  return `${num}${fam}`
}

/** 色相表記からHEXコードを取得（例: "5R" → "#FF545C"） */
export const getMunsellHueHex = (hue: MunsellHueLabel): string | undefined =>
  MUNSELL_HUE_HEX_MAP.get(hue)
