import { describe, it, expect } from "vitest"
import { CONTRAST_PAIRS } from "./lightnessContrastEqualBrightness.config"
import { equalizingContrastK, canAppearEqual } from "$lib/color/lightnessContrast"

/**
 * 図解 LightnessContrastEqualBrightness の下段（対比行）で、
 * 明度の異なる2つの図が「同じ明るさに見える」配色になっているかを検証する。
 *
 * 判定は明度対比の見積もりモデル（$lib/color/lightnessContrast）による目安であり、
 * 実際の見え方は目視確認が前提。ここでは配色が「そろう見込みの範囲」を外れていないかを守る。
 *
 * この図解は「大きな地＋細い星の図」という構成で、小面積パッチを前提とした一般的な目安
 * （REALISTIC_MAX_K=0.2）より同時対比が強く出る。目視で確認した配色を許容しつつ、
 * 極端な明度差（例: 必要k≈0.7）は弾くためのサニティ上限として広めの値を使う。
 */
const DIAGRAM_MAX_K = 0.5

describe("明度対比の図解：下段の2つの図は同じ明るさに見え得る", () => {
  const [left, right] = CONTRAST_PAIRS

  it("明るい図と暗い図が、明暗の異なる地に正しく配置されている", () => {
    // 左＝明るい図を明るい地に、右＝暗い図を暗い地に → 見た目が歩み寄る方向
    const k = equalizingContrastK(left, right)
    expect(k).toBeGreaterThan(0)
  })

  it(`同明度に見せるのに必要な対比係数が想定範囲（k ≤ ${DIAGRAM_MAX_K}）に収まる`, () => {
    const k = equalizingContrastK(left, right)
    expect(k).toBeLessThanOrEqual(DIAGRAM_MAX_K)
  })

  it("同じ明るさに見え得ると判定される", () => {
    expect(canAppearEqual(left, right, DIAGRAM_MAX_K)).toBe(true)
  })
})
