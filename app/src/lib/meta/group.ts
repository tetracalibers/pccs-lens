export type CgGroup = "CG" | "ImgP"

export const groupLabels: Record<CgGroup, string> = {
  CG: "CG",
  ImgP: "画像処理"
}

export const groupColors: Record<CgGroup, string> = {
  CG: "var(--pastel-blue)",
  ImgP: "var(--pastel-green)"
}
