import chroma from "chroma-js"

/**
 * 色が明るいかどうかを判定する。
 * chroma.js の相対輝度（WCAG基準）を用い、閾値 0.35 で判定する。
 */
export function isLightColor(hex: string): boolean {
  return chroma(hex).luminance() > 0.35
}
