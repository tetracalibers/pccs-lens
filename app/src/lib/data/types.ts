export type AchromaticBucket = "W" | "ltGy" | "mGy" | "dkGy" | "Bk"

export type PCCSColor = {
  notation: string
  hex: string
  toneSymbol: string | null
  hueNumber: number | null
  isNeutral: boolean
  achromaticBucket: AchromaticBucket | null
  munsell?: string // 奇数番号の色相など、一般的ではない色はマンセル値データが見つからないため、値が未設定の場合がある
}

export type ApproximateResult = {
  color: PCCSColor
  deltaE: number
}

export type Lab = {
  L: number
  a: number
  b: number
}
