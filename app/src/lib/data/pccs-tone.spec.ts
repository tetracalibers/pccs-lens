import { describe, it, expect } from "vitest"
import { PCCS_TONE_BASED_PALETTE_RULE } from "./pccs-tone"

describe("PCCS_TONE_BASED_PALETTE_RULE", () => {
  // ===== identicalTone =====

  describe("identicalTone", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.identicalTone

    it("suggestNextは常にnullを返す", () => {
      expect(rule.suggestNext("v")).toBeNull()
      expect(rule.suggestNext("p")).toBeNull()
    })
  })

  // ===== similarToneVertical =====

  describe("similarToneVertical", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.similarToneVertical

    it("allowedTonesにvを含まない（vは縦グループに属さない）", () => {
      expect(rule.allowedTones).not.toContain("v")
    })

    it("p → ltg, g, dkg（col=0グループ）", () => {
      const result = rule.suggestNext("p")
      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining(["ltg", "g", "dkg"]))
    })

    it("lt → sf, d, dk（col=1グループ）", () => {
      const result = rule.suggestNext("lt")
      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining(["sf", "d", "dk"]))
    })

    it("b → s, dp（col=2グループ）", () => {
      const result = rule.suggestNext("b")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["s", "dp"]))
    })

    it("sf → lt, d, dk（自分を除くcol=1グループ）", () => {
      const result = rule.suggestNext("sf")
      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining(["lt", "d", "dk"]))
    })
  })

  // ===== similarToneHorizontal =====

  describe("similarToneHorizontal", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.similarToneHorizontal

    it("p → lt, b", () => {
      const result = rule.suggestNext("p")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["lt", "b"]))
    })

    it("lt → p, b", () => {
      const result = rule.suggestNext("lt")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["p", "b"]))
    })

    it("b → p, lt", () => {
      const result = rule.suggestNext("b")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["p", "lt"]))
    })

    it("ltg → sf（2要素グループ）", () => {
      expect(rule.suggestNext("ltg")).toEqual(["sf"])
    })

    it("g → d（2要素グループ）", () => {
      expect(rule.suggestNext("g")).toEqual(["d"])
    })

    it("dkg → dk, dp", () => {
      const result = rule.suggestNext("dkg")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["dk", "dp"]))
    })

    it("s → v（2要素グループ）", () => {
      expect(rule.suggestNext("s")).toEqual(["v"])
    })

    it("v → s（2要素グループ）", () => {
      expect(rule.suggestNext("v")).toEqual(["s"])
    })
  })

  // ===== similarToneDiagonal =====
  // トーンマップ座標: p(0,0) lt(0,1) b(1,2) ltg(2,0) sf(2,1) s(3,2) v(3,3) g(4,0) d(4,1) dp(5,2) dkg(6,0) dk(6,1)
  // 斜め隣接 = 列差1 かつ 行差1または2

  describe("similarToneDiagonal", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.similarToneDiagonal

    it("p(0,0) → sf（列差1かつ行差2の唯一のトーン）", () => {
      const result = rule.suggestNext("p")
      expect(result).toHaveLength(1)
      expect(result).toContain("sf")
    })

    it("lt(0,1) → ltg, b（列差1かつ行差1または2）", () => {
      const result = rule.suggestNext("lt")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["ltg", "b"]))
    })

    it("b(1,2) → lt, sf, v（3方向から隣接）", () => {
      const result = rule.suggestNext("b")
      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining(["lt", "sf", "v"]))
    })

    it("sf(2,1) → p, g, b, s（4トーンから隣接）", () => {
      const result = rule.suggestNext("sf")
      expect(result).toHaveLength(4)
      expect(result).toEqual(expect.arrayContaining(["p", "g", "b", "s"]))
    })

    it("v(3,3) → b, dp（列差1かつ行差2のみ存在）", () => {
      const result = rule.suggestNext("v")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["b", "dp"]))
    })

    it("dk(6,1) → g, dp（末端行からの斜め）", () => {
      const result = rule.suggestNext("dk")
      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining(["g", "dp"]))
    })

    it("dkg(6,0) → d（コーナートーン）", () => {
      const result = rule.suggestNext("dkg")
      expect(result).toHaveLength(1)
      expect(result).toContain("d")
    })
  })

  // ===== contrastingToneLightness =====

  describe("contrastingToneLightness", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.contrastingToneLightness

    it("明清色(p)の次は暗清色トーン全て", () => {
      const result = rule.suggestNext("p")
      expect(result).toEqual(expect.arrayContaining(["dkg", "dk", "dp"]))
    })

    it("暗清色(dk)の次は明清色トーン全て", () => {
      const result = rule.suggestNext("dk")
      expect(result).toEqual(expect.arrayContaining(["p", "lt", "b"]))
    })
  })

  // ===== contrastingToneSaturation =====

  describe("contrastingToneSaturation", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.contrastingToneSaturation

    it("高彩度(v)の次は低彩度トーン全て", () => {
      const result = rule.suggestNext("v")
      expect(result).toEqual(expect.arrayContaining(["p", "ltg", "g", "dkg"]))
    })

    it("低彩度(p)の次は高彩度トーン全て", () => {
      const result = rule.suggestNext("p")
      expect(result).toEqual(expect.arrayContaining(["b", "s", "dp", "v"]))
    })
  })

  // ===== contrastingToneLightnessSaturation =====
  // 縦・横・斜めいずれの隣接も持たないトーンのみを返す（sfとdも除外）

  describe("contrastingToneLightnessSaturation", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.contrastingToneLightnessSaturation

    it("allowedTonesにsfとdを含まない", () => {
      expect(rule.allowedTones).not.toContain("sf")
      expect(rule.allowedTones).not.toContain("d")
    })

    it("p → s, v, dk, dp（縦:ltg,g,dkg / 横:lt,b / 斜め:sf を除き、sf,dも除く）", () => {
      // 隣接: {p, ltg, g, dkg, lt, b, sf}
      // 残り候補: d, s, v, dk, dp → sfとdを除く → s, v, dk, dp
      const result = rule.suggestNext("p")
      expect(result).toHaveLength(4)
      expect(result).toEqual(expect.arrayContaining(["s", "v", "dk", "dp"]))
    })

    it("v → p, lt, ltg, g, dk, dkg（縦グループなし / 横:s / 斜め:b,dp を除き、sf,dも除く）", () => {
      // 隣接: {v, s, b, dp}
      // 残り候補: p, lt, ltg, sf, g, d, dk, dkg → sfとdを除く → p, lt, ltg, g, dk, dkg
      const result = rule.suggestNext("v")
      expect(result).toHaveLength(6)
      expect(result).toEqual(expect.arrayContaining(["p", "lt", "ltg", "g", "dk", "dkg"]))
    })

    it("隣接トーン(sf,d等)自身をsuggestNextに渡してもsfとdは返らない", () => {
      const result = rule.suggestNext("p")
      expect(result).not.toContain("sf")
      expect(result).not.toContain("d")
    })
  })

  // ===== achromaticTones =====

  describe("achromaticTones", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.achromaticTones

    it("Wの次は自分以外の無彩色トーン全て", () => {
      const result = rule.suggestNext("W")
      expect(result).not.toContain("W")
      expect(result).toEqual(expect.arrayContaining(["ltGy", "mGy", "dkGy", "Bk"]))
    })

    it("Bkの次は自分以外の無彩色トーン全て", () => {
      const result = rule.suggestNext("Bk")
      expect(result).not.toContain("Bk")
      expect(result).toEqual(expect.arrayContaining(["W", "ltGy", "mGy", "dkGy"]))
    })
  })

  // ===== achromaticAndHighSaturation =====

  describe("achromaticAndHighSaturation", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.achromaticAndHighSaturation

    it("無彩色(W)の次は高彩度トーン全て", () => {
      const result = rule.suggestNext("W")
      expect(result).toEqual(expect.arrayContaining(["b", "s", "dp", "v"]))
    })

    it("高彩度(v)の次は無彩色トーン全て", () => {
      const result = rule.suggestNext("v")
      expect(result).toEqual(expect.arrayContaining(["W", "ltGy", "mGy", "dkGy", "Bk"]))
    })
  })

  // ===== achromaticAndLowSaturation =====

  describe("achromaticAndLowSaturation", () => {
    const rule = PCCS_TONE_BASED_PALETTE_RULE.achromaticAndLowSaturation

    it("無彩色(Bk)の次は低彩度トーン全て", () => {
      const result = rule.suggestNext("Bk")
      expect(result).toEqual(expect.arrayContaining(["p", "ltg", "g", "dkg"]))
    })

    it("低彩度(g)の次は無彩色トーン全て", () => {
      const result = rule.suggestNext("g")
      expect(result).toEqual(expect.arrayContaining(["W", "ltGy", "mGy", "dkGy", "Bk"]))
    })
  })
})
