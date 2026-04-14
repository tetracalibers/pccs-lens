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

// 対照トーンかどうか（横・縦・斜め方向のいずれでも隣り合っていない）
export const isContrastingTone = (toneSymbol: string): boolean => {
  // TODO: 横・縦・斜め方向のいずれでも隣り合っていないトーンを判定できるようにする
  return false
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
      // TODO: 縦に隣り合う全トーンを返すようにする
      return [tone]
    }
  },
  similarToneHorizontal: {
    label: "類似トーン（横方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS,
    suggestNext: (tone: string) => {
      // TODO: 横に隣り合う全トーンを返すようにする
      return [tone]
    }
  },
  similarToneDiagonal: {
    label: "類似トーン（斜め方向）",
    allowedTones: PCCS_CHROMATIC_TONE_SYMBOLS,
    suggestNext: (tone: string) => {
      // TODO: 斜めに隣り合う全トーンを返すようにする
      return [tone]
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
      // TODO: 対照トーン（明度方向）・対照トーン（彩度方向）・類似トーンのいずれにも当てはまらないトーンを返すようにする
      return [tone]
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
