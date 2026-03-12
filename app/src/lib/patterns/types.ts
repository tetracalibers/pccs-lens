export type ThemeId =
  | "elegant"
  | "casual"
  | "classic"
  | "clear"
  | "chic"
  | "dynamic"
  | "warm-natural"
  | "fresh-natural"
  | "modern"
  | "romantic"

export type ColorRole = "base" | "assort" | "accent"

/** 色相・トーンの選択状態（hueNumber=null は無彩色） */
export type SelectedColor = {
  hueNumber: number | null
  toneSymbol: string
}

export type SuggestInput = {
  theme: ThemeId
  role: ColorRole
  baseColor?: SelectedColor
  assortColor?: SelectedColor
}

export type SuggestOutput = {
  suggestedHues: number[] // 推奨色相番号（有彩色のみ）
  suggestedTones: string[] // 推奨トーン記号（有彩色・無彩色バケット混在可）
}

export type ThemeDef = {
  id: ThemeId
  labelJa: string
  labelEn: string
  imageDescription: string
  coloringDescription: string
  allowedHues: number[]
  allowedTones: string[]
  isDynamic: boolean
  roleDescriptions: Record<ColorRole, string>
}
