export type CgGroup = "CG" | "ImgP"

export const groupLabels: Record<CgGroup, string> = {
  CG: "CG",
  ImgP: "画像処理"
}

export const groupColors: Record<CgGroup, string> = {
  CG: "var(--color-cg)",
  ImgP: "var(--color-image-processing)"
}
