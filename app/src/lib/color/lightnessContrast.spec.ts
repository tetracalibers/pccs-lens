import { describe, it, expect } from "vitest"
import {
  lightness,
  apparentLightness,
  equalizingContrastK,
  canAppearEqual,
  REALISTIC_MAX_K
} from "./lightnessContrast"

describe("lightness", () => {
  it("白は L*≈100、黒は L*≈0", () => {
    expect(lightness("#ffffff")).toBeCloseTo(100, 0)
    expect(lightness("#000000")).toBeCloseTo(0, 0)
  })
})

describe("apparentLightness", () => {
  it("k=0 では図の実際の L* と一致する（対比なし）", () => {
    const figure = "#808080"
    expect(apparentLightness(figure, "#ffffff", 0)).toBeCloseTo(lightness(figure), 5)
  })

  it("明るい地では暗く、暗い地では明るく見積もる", () => {
    const figure = "#808080"
    const actual = lightness(figure)
    expect(apparentLightness(figure, "#ffffff", 0.2)).toBeLessThan(actual)
    expect(apparentLightness(figure, "#000000", 0.2)).toBeGreaterThan(actual)
  })
})

describe("equalizingContrastK", () => {
  const brighter = { figure: "#a0a0a0", ground: "#ffffff" } // 明るい図を明るい地に
  const darker = { figure: "#606060", ground: "#000000" } // 暗い図を暗い地に

  it("正しい方向の配置では正の k になる", () => {
    expect(equalizingContrastK(brighter, darker)).toBeGreaterThan(0)
  })

  it("地の明暗が逆だと負（そろわない方向）になる", () => {
    expect(
      equalizingContrastK(
        { figure: "#a0a0a0", ground: "#000000" },
        { figure: "#606060", ground: "#ffffff" }
      )
    ).toBeLessThan(0)
  })

  it("逆算した k を入れると左右の見かけ明度が一致する", () => {
    const k = equalizingContrastK(brighter, darker)
    expect(apparentLightness(brighter.figure, brighter.ground, k)).toBeCloseTo(
      apparentLightness(darker.figure, darker.ground, k),
      5
    )
  })
})

describe("canAppearEqual", () => {
  it("明度差が小さければ現実的な k の範囲でそろう", () => {
    expect(
      canAppearEqual(
        { figure: "#939393", ground: "#ffffff" }, // Gy-6.0
        { figure: "#797979", ground: "#252525" } // Gy-5.0 を Bk に
      )
    ).toBe(true)
  })

  it("明度差が大きすぎるとそろわない", () => {
    expect(
      canAppearEqual(
        { figure: "#c8c8c8", ground: "#ffffff" }, // Gy-8.0
        { figure: "#484848", ground: "#000000" } // Gy-3.0
      )
    ).toBe(false)
  })

  it("maxK を緩めると判定が変わりうる（必要 k ≈ 0.3 のペア）", () => {
    const a = { figure: "#a0a0a0", ground: "#ffffff" } // Gy-6.5 を白地に
    const b = { figure: "#6d6d6d", ground: "#252525" } // Gy-4.5 を Bk に
    expect(canAppearEqual(a, b, REALISTIC_MAX_K)).toBe(false) // 0.2 では届かない
    expect(canAppearEqual(a, b, 0.4)).toBe(true) // 緩めれば範囲内
  })
})
