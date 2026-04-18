import jisColorsJson from "./jis_colors.json"
import jisColorFamilyJson from "./jis_color_family.json"

export type ColorFamily = "red" | "brown" | "yellow" | "green" | "blue" | "purple" | "neutral"

export type RedSubfamily = "pink-red-purple" | "orange-red"
export type BrownSubfamily =
  | "yellow-red-light-brown"
  | "yellow-green-brown"
  | "yellow-red-dark-brown"
export type YellowSubfamily = "light-yellow" | "dark-yellow"
export type GreenSubfamily = "yellow-green" | "light-blue-green" | "dark-blue-green"
export type BlueSubfamily = "water-light-blue-green" | "blue-green" | "blue-purple"
export type PurpleSubfamily = "light-purple-blue-purple" | "dark-purple-red-purple"
export type NeutralSubfamily = "off-neutral" | "neutral-gray"

export type ColorSubfamily =
  | RedSubfamily
  | BrownSubfamily
  | YellowSubfamily
  | GreenSubfamily
  | BlueSubfamily
  | PurpleSubfamily
  | NeutralSubfamily

export type JISApproximatePccs = {
  notation: string
  deltaE: number
}

export type JISColor = {
  id: string
  name: string
  nameSegments?: string[]
  reading: string
  systematicName: string
  hex: string
  examLevel: 2 | 3 | null
  munsell: string
  category: ColorFamily
  subcategory: ColorSubfamily
  // 最低1件、最大3件
  approximatePccs: [JISApproximatePccs, ...JISApproximatePccs[]]
}

export type JISApproximateResult = {
  color: JISColor
  deltaE: number
}

export type JISSubfamily = {
  id: ColorSubfamily
  name: string
  hintPCCSHue: {
    from: number
    to: number
  }
}

export type JISColorFamily = {
  id: ColorFamily
  name: string
  subfamilies: JISSubfamily[]
}

export const JIS_COLORS: JISColor[] = jisColorsJson as JISColor[]

export const JIS_COLOR_FAMILIES: JISColorFamily[] = jisColorFamilyJson as JISColorFamily[]
