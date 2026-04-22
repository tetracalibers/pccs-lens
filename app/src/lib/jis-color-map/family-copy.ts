import type { ColorFamily } from "$lib/data/jis-colors"

const formatFamilyDescription = (familyName: string): string => {
  return `${familyName}の慣用色名マップ`
}

export const FAMILY_DESCRIPTIONS: Record<ColorFamily, string> = {
  red: formatFamilyDescription("赤系"),
  brown: formatFamilyDescription("茶系"),
  yellow: formatFamilyDescription("黄系"),
  green: formatFamilyDescription("緑系"),
  blue: formatFamilyDescription("青系"),
  purple: formatFamilyDescription("紫系"),
  neutral: formatFamilyDescription("無彩色・準無彩色")
}

// 彩度比較図のグラデーション終端用の代表 HEX（高彩度側の色）
export const FAMILY_PRIMARY_HEX: Record<ColorFamily, string> = {
  red: "#e60033",
  brown: "#8b4513",
  yellow: "#ffd400",
  green: "#00a040",
  blue: "#0068b7",
  purple: "#7e3f8f",
  neutral: "#888888"
}
