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
  colorDescription: string
  originDescription: string
  hex: string
  examLevel: 2 | 3 | null
  munsell: string
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

export type JISCompareSection = {
  targets: string[]
  hintJIS?: string[]
  hintPCCSHue?: number[]
}

export type JISSubfamilyData = {
  colors: JISColor[]
  compareSections: JISCompareSection[]
}

export type JISColorsBySubfamily = Record<ColorSubfamily, JISSubfamilyData>

export const JIS_COLOR_FAMILIES: JISColorFamily[] = jisColorFamilyJson as JISColorFamily[]

const JIS_COLORS_BY_SUBFAMILY = jisColorsJson as JISColorsBySubfamily

export const JIS_COLORS_BY_GROUP: Map<ColorFamily | ColorSubfamily, JISColor[]> = (() => {
  const map = new Map<ColorFamily | ColorSubfamily, JISColor[]>()
  for (const family of JIS_COLOR_FAMILIES) {
    const familyColors: JISColor[] = []
    for (const sub of family.subfamilies) {
      const subColors = JIS_COLORS_BY_SUBFAMILY[sub.id]?.colors ?? []
      map.set(sub.id, subColors)
      familyColors.push(...subColors)
    }
    map.set(family.id, familyColors)
  }
  return map
})()

export const JIS_COLORS: JISColor[] = JIS_COLOR_FAMILIES.flatMap((f) =>
  f.subfamilies.flatMap((s) => JIS_COLORS_BY_SUBFAMILY[s.id]?.colors ?? [])
)

export const JIS_HEX_BY_ID: Map<string, string> = new Map(JIS_COLORS.map((c) => [c.id, c.hex]))

export const JIS_COLOR_BY_ID: Map<string, JISColor> = new Map(JIS_COLORS.map((c) => [c.id, c]))

export const getJisColorById = (id: string): JISColor | undefined => JIS_COLOR_BY_ID.get(id)

export const getJisColorsByIds = (ids: string[]): JISColor[] =>
  ids.map((id) => JIS_COLOR_BY_ID.get(id)).filter((c): c is JISColor => c !== undefined)

export const getCompareSectionsBySubfamily = (subfamilyId: ColorSubfamily): JISCompareSection[] =>
  JIS_COLORS_BY_SUBFAMILY[subfamilyId]?.compareSections ?? []

export const getFamilyIdBySubfamilyId = (subfamilyId: ColorSubfamily): ColorFamily | null => {
  for (const family of JIS_COLOR_FAMILIES) {
    if (family.subfamilies.some((s) => s.id === subfamilyId)) return family.id
  }
  return null
}

export type JISColorGroupId = ColorFamily | ColorSubfamily | "all"

const FAMILY_IDS: Set<ColorFamily> = new Set(JIS_COLOR_FAMILIES.map((f) => f.id))

export const isColorFamily = (value: string): value is ColorFamily =>
  (FAMILY_IDS as Set<string>).has(value)

export const getJisColorsByGroup = (groupId: JISColorGroupId): JISColor[] => {
  if (groupId === "all") return JIS_COLORS
  return JIS_COLORS_BY_GROUP.get(groupId) ?? []
}

export const getSubfamiliesByGroup = (groupId: JISColorGroupId): JISSubfamily[] => {
  if (groupId === "all") return JIS_COLOR_FAMILIES.flatMap((f) => f.subfamilies)
  if ((FAMILY_IDS as Set<string>).has(groupId)) {
    const family = JIS_COLOR_FAMILIES.find((f) => f.id === groupId)
    return family ? family.subfamilies : []
  }
  for (const family of JIS_COLOR_FAMILIES) {
    const sub = family.subfamilies.find((s) => s.id === groupId)
    if (sub) return [sub]
  }
  return []
}
