import type { ColorFamily } from "$lib/data/jis-colors"

export const FAMILY_DESCRIPTIONS: Record<ColorFamily, string> = {
  red: "赤系の慣用色",
  brown: "茶系の慣用色",
  yellow: "黄系の慣用色",
  green: "緑系の慣用色",
  blue: "青系の慣用色",
  purple: "紫系の慣用色",
  neutral: "無彩色・準無彩色の慣用色"
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
