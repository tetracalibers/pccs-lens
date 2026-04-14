import pccsTones from "./pccs_tone.json"

export const PCCS_TONES = pccsTones

// 有彩色トーンの一覧
export const PCCS_CHROMATIC_TONE_SYMBOLS = PCCS_TONES.filter((tone) => !tone.isNeutral).map(
  (tone) => tone.toneSymbol
)
// 無彩色トーンの一覧（グレイ系トーンはGyのみ）
export const PCCS_ACHROMATIC_TONE_SYMBOLS_MINIMUM = PCCS_TONES.filter((tone) => tone.isNeutral).map(
  (tone) => tone.toneSymbol
)
// 無彩色トーンの一覧（グレイ系トーンを3種類に細分化）
export const PCCS_ACHROMATIC_TONE_SYMBOLS = ["W", "ltGy", "mGy", "dkGy", "Bk"]

// 低彩度トーンの一覧
export const PCCS_LOW_SATURATION_TONE_SYMBOLS = ["p", "ltg", "g", "dkg"]
// 中彩度トーンの一覧
export const PCCS_MEDIUM_SATURATION_TONE_SYMBOLS = ["lt", "sf", "d", "dk"]
// 高彩度トーンの一覧
export const PCCS_HIGH_SATURATION_TONE_SYMBOLS = ["b", "s", "dp", "v"]

// 低彩度トーンかどうか
export const isLowSaturationTone = (toneSymbol: string) =>
  PCCS_LOW_SATURATION_TONE_SYMBOLS.includes(toneSymbol)
// 中彩度トーンかどうか
export const isMediumSaturationTone = (toneSymbol: string) =>
  PCCS_MEDIUM_SATURATION_TONE_SYMBOLS.includes(toneSymbol)
// 高彩度トーンかどうか
export const isHighSaturationTone = (toneSymbol: string) =>
  PCCS_HIGH_SATURATION_TONE_SYMBOLS.includes(toneSymbol)

// 明清色トーンの一覧
export const PCCS_TINT_TONE_SYMBOLS = ["p", "lt", "b"]
// 暗清色トーンの一覧
export const PCCS_SHADE_TONE_SYMBOLS = ["dkg", "dk", "dp"]

// 明清色かどうか
export const isTintTone = (toneSymbol: string) => PCCS_TINT_TONE_SYMBOLS.includes(toneSymbol)
// 暗清色かどうか
export const isShadeTone = (toneSymbol: string) => PCCS_SHADE_TONE_SYMBOLS.includes(toneSymbol)

// 有彩色トーンのトーンマップ上の位置関係
export const PCCS_CHROMATIC_TONE_MAP_STRUCTURE = [
  ["p", "lt", null, null],
  [null, null, "b", null],
  ["ltg", "sf", null, null],
  [null, null, "s", "v"],
  ["g", "d", null, null],
  [null, null, "dp", null],
  ["dkg", "dk", null, null]
]

// 横に並ぶトーンの組み合わせ
export const PCCS_CHROMATIC_TONE_SIMILAR_HORIZONTAL = [
  ["p", "lt", "b"],
  ["ltg", "sf"],
  ["g", "d"],
  ["dkg", "dk", "dp"],
  ["s", "v"]
]
// 縦に並ぶトーンの組み合わせ
export const PCCS_CHROMATIC_TONE_SIMILAR_VERTICAL = [
  ["p", "ltg", "g", "dkg"],
  ["lt", "sf", "d", "dk"],
  ["b", "s", "dp"]
]

// トーンマップ上の座標マップ（行インデックス, 列インデックス）
const TONE_POSITION_MAP: Record<string, [number, number]> = Object.fromEntries(
  PCCS_CHROMATIC_TONE_MAP_STRUCTURE.flatMap((row, rowIdx) =>
    row
      .map((tone, colIdx) => (tone !== null ? [tone, [rowIdx, colIdx] as [number, number]] : null))
      .filter((entry): entry is [string, [number, number]] => entry !== null)
  )
)

// 縦方向に隣り合うトーンを返す（同じ縦グループ内の他のトーン）
const getVerticallyAdjacentTones = (toneSymbol: string): string[] => {
  const group = PCCS_CHROMATIC_TONE_SIMILAR_VERTICAL.find((g) => g.includes(toneSymbol))
  return group ? group.filter((t) => t !== toneSymbol) : []
}

// 横方向に隣り合うトーンを返す（同じ横グループ内の他のトーン）
const getHorizontallyAdjacentTones = (toneSymbol: string): string[] => {
  const group = PCCS_CHROMATIC_TONE_SIMILAR_HORIZONTAL.find((g) => g.includes(toneSymbol))
  return group ? group.filter((t) => t !== toneSymbol) : []
}

// 斜め方向に隣り合うトーンを返す（列差が1かつ行差が1または2のトーン）
const getDiagonallyAdjacentTones = (toneSymbol: string): string[] => {
  const pos = TONE_POSITION_MAP[toneSymbol]
  if (!pos) return []
  const [row, col] = pos
  return Object.entries(TONE_POSITION_MAP)
    .filter(([, otherPos]) => {
      const rowDiff = Math.abs(row - otherPos[0])
      const colDiff = Math.abs(col - otherPos[1])
      return colDiff === 1 && (rowDiff === 1 || rowDiff === 2)
    })
    .map(([tone]) => tone)
}

interface ToneBasedPaletteRule {
  // ルール名
  label: string
  // 初期状態で選択できるトーン
  allowedTones: string[]
  // あるトーンを選んだ時に、次にどのトーンを選択可能にするか
  // どのトーンも選択できない場合はnullを返す
  suggestNext: (toneSymbol: string) => string[] | null
}

export const PCCS_TONE_BASED_PALETTE_RULE: Record<string, ToneBasedPaletteRule> = {
  identicalTone: {
    label: "同一トーン",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS,
    // 同一トーンなので他のトーンは選択できない
    suggestNext: (_tone: string) => null
  },
  similarToneVertical: {
    label: "類似トーン（縦方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS.filter((tone) => tone !== "v"),
    suggestNext: (tone: string) => {
      const adjacent = getVerticallyAdjacentTones(tone)
      return adjacent.length > 0 ? adjacent : null
    }
  },
  similarToneHorizontal: {
    label: "類似トーン（横方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS,
    suggestNext: (tone: string) => {
      const adjacent = getHorizontallyAdjacentTones(tone)
      return adjacent.length > 0 ? adjacent : null
    }
  },
  similarToneDiagonal: {
    label: "類似トーン（斜め方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS,
    suggestNext: (tone: string) => {
      const adjacent = getDiagonallyAdjacentTones(tone)
      return adjacent.length > 0 ? adjacent : null
    }
  },
  contrastingToneLightness: {
    label: "対照トーン（明度方向）",
    allowedTones: [...PCCS_TINT_TONE_SYMBOLS, ...PCCS_SHADE_TONE_SYMBOLS],
    suggestNext: (tone: string) => {
      if (isTintTone(tone)) return PCCS_SHADE_TONE_SYMBOLS
      if (isShadeTone(tone)) return PCCS_TINT_TONE_SYMBOLS
      return null
    }
  },
  contrastingToneSaturation: {
    label: "対照トーン（彩度方向）",
    allowedTones: [...PCCS_LOW_SATURATION_TONE_SYMBOLS, ...PCCS_HIGH_SATURATION_TONE_SYMBOLS],
    suggestNext: (tone: string) => {
      if (isHighSaturationTone(tone)) return PCCS_LOW_SATURATION_TONE_SYMBOLS
      if (isLowSaturationTone(tone)) return PCCS_HIGH_SATURATION_TONE_SYMBOLS
      return null
    }
  },
  contrastingToneLightnessSaturation: {
    label: "対照トーン（明度・彩度方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS.filter((tone) => !["sf", "d"].includes(tone)),
    suggestNext: (tone: string) => {
      const adjacentTones = new Set([
        tone,
        ...getVerticallyAdjacentTones(tone),
        ...getHorizontallyAdjacentTones(tone),
        ...getDiagonallyAdjacentTones(tone)
      ])
      const contrastingTones = PCCS_CHROMATIC_TONE_SYMBOLS.filter(
        (t) => !adjacentTones.has(t) && !["sf", "d"].includes(t)
      )
      return contrastingTones.length > 0 ? contrastingTones : null
    }
  },
  achromaticTones: {
    label: "無彩色どうし",
    allowedTones: PCCS_ACHROMATIC_TONE_SYMBOLS,
    suggestNext: (tone: string) => {
      // 自分以外の無彩色トーンならなんでもいい
      return PCCS_ACHROMATIC_TONE_SYMBOLS.filter((t) => t !== tone)
    }
  },
  achromaticAndHighSaturation: {
    label: "無彩色と高彩度",
    allowedTones: [...PCCS_ACHROMATIC_TONE_SYMBOLS, ...PCCS_HIGH_SATURATION_TONE_SYMBOLS],
    suggestNext: (tone: string) => {
      if (PCCS_ACHROMATIC_TONE_SYMBOLS.includes(tone)) return PCCS_HIGH_SATURATION_TONE_SYMBOLS
      if (PCCS_HIGH_SATURATION_TONE_SYMBOLS.includes(tone)) return PCCS_ACHROMATIC_TONE_SYMBOLS
      return null
    }
  },
  achromaticAndLowSaturation: {
    label: "無彩色と低彩度",
    allowedTones: [...PCCS_ACHROMATIC_TONE_SYMBOLS, ...PCCS_LOW_SATURATION_TONE_SYMBOLS],
    suggestNext: (tone: string) => {
      if (PCCS_ACHROMATIC_TONE_SYMBOLS.includes(tone)) return PCCS_LOW_SATURATION_TONE_SYMBOLS
      if (PCCS_LOW_SATURATION_TONE_SYMBOLS.includes(tone)) return PCCS_ACHROMATIC_TONE_SYMBOLS
      return null
    }
  }
}
