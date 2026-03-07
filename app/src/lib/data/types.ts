export type AchromaticBucket = "W" | "ltGy" | "mGy" | "dkGy" | "Bk"

export type PCCSColor = {
  notation: string
  hex: string
  toneSymbol: string | null
  hueNumber: number | null
  isNeutral: boolean
  achromaticBucket: AchromaticBucket | null
}

export type JISColor = {
  name: string
  reading: string
  hex: string
  examLevel: 2 | 3 | null
}

export type ApproximateResult = {
  color: PCCSColor
  deltaE: number
}

export type JISApproximateResult = {
  color: JISColor
  deltaE: number
}

export type Lab = {
  L: number
  a: number
  b: number
}
