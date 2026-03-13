import { describe, it, expect } from "vitest"
import { computeSuggest, hueDistance } from "./suggest"

describe("hueDistance", () => {
  it("同一色相は0", () => {
    expect(hueDistance(1, 1)).toBe(0)
  })

  it("隣接色相は1", () => {
    expect(hueDistance(1, 2)).toBe(1)
    expect(hueDistance(24, 1)).toBe(1) // ラップアラウンド
  })

  it("補色（最大距離）は12", () => {
    expect(hueDistance(1, 13)).toBe(12)
    expect(hueDistance(6, 18)).toBe(12)
  })

  it("対称性", () => {
    expect(hueDistance(3, 18)).toBe(hueDistance(18, 3))
  })
})

describe("computeSuggest: elegant", () => {
  it("base: p/ltg トーンを返す", () => {
    const out = computeSuggest({ theme: "elegant", role: "base" })
    expect(out.suggestedTones).toEqual(["p", "ltg"])
    expect(out.suggestedHues).toContain(19)
    expect(out.suggestedHues).toContain(1)
  })

  it("assort(base=p): ltトーンを返す", () => {
    const out = computeSuggest({
      theme: "elegant",
      role: "assort",
      baseColor: { hueNumber: 21, toneSymbol: "p" }
    })
    expect(out.suggestedTones).toEqual(["lt"])
  })

  it("assort(base=ltg): sf でなく lt を返す（エレガント固有ルール）", () => {
    const out = computeSuggest({
      theme: "elegant",
      role: "assort",
      baseColor: { hueNumber: 21, toneSymbol: "ltg" }
    })
    expect(out.suggestedTones).toEqual(["lt"])
    expect(out.suggestedTones).not.toContain("sf")
  })

  it("accent: b/dp/v を含まない", () => {
    const out = computeSuggest({ theme: "elegant", role: "accent" })
    expect(out.suggestedTones).not.toContain("b")
    expect(out.suggestedTones).not.toContain("dp")
    expect(out.suggestedTones).not.toContain("v")
  })
})

describe("computeSuggest: casual", () => {
  it("base: 橙〜黄系（3〜8）と p/lt トーン", () => {
    const out = computeSuggest({ theme: "casual", role: "base" })
    expect(out.suggestedHues).toEqual([3, 4, 5, 6, 7, 8])
    expect(out.suggestedTones).toContain("p")
    expect(out.suggestedTones).toContain("lt")
  })

  it("assort: ベースとの色相差4以上の色相のみ返す", () => {
    const out = computeSuggest({
      theme: "casual",
      role: "assort",
      baseColor: { hueNumber: 5, toneSymbol: "lt" }
    })
    for (const h of out.suggestedHues) {
      expect(hueDistance(h, 5)).toBeGreaterThanOrEqual(4)
    }
  })

  it("accent: 高彩度トーン（b/s/v）を返す", () => {
    const out = computeSuggest({
      theme: "casual",
      role: "accent",
      baseColor: { hueNumber: 5, toneSymbol: "lt" },
      assortColor: { hueNumber: 14, toneSymbol: "b" }
    })
    expect(out.suggestedTones).toContain("b")
    expect(out.suggestedTones).toContain("s")
    expect(out.suggestedTones).toContain("v")
  })
})

describe("computeSuggest: classic", () => {
  it("assort: ベースとの色相差3以内の色相のみ返す", () => {
    const out = computeSuggest({
      theme: "classic",
      role: "assort",
      baseColor: { hueNumber: 6, toneSymbol: "dk" }
    })
    for (const h of out.suggestedHues) {
      expect(hueDistance(h, 6)).toBeLessThanOrEqual(3)
    }
  })

  it("accent: 11〜18 の色相を返す", () => {
    const out = computeSuggest({ theme: "classic", role: "accent" })
    expect(out.suggestedHues.every((h) => h >= 11 && h <= 18)).toBe(true)
  })
})

describe("computeSuggest: clear", () => {
  it("assort(base=有彩色): W/ltGy トーンを返す", () => {
    const out = computeSuggest({
      theme: "clear",
      role: "assort",
      baseColor: { hueNumber: 16, toneSymbol: "p" }
    })
    expect(out.suggestedTones).toContain("W")
    expect(out.suggestedTones).toContain("ltGy")
    expect(out.suggestedTones).not.toContain("p")
  })

  it("assort(base=無彩色): p/lt トーンを返す", () => {
    const out = computeSuggest({
      theme: "clear",
      role: "assort",
      baseColor: { hueNumber: null, toneSymbol: "W" }
    })
    expect(out.suggestedTones).toContain("p")
    expect(out.suggestedTones).toContain("lt")
    expect(out.suggestedTones).not.toContain("W")
  })
})

describe("computeSuggest: chic", () => {
  it("assort(base=無彩色): 有彩色系トーンを返す", () => {
    const out = computeSuggest({
      theme: "chic",
      role: "assort",
      baseColor: { hueNumber: null, toneSymbol: "Bk" }
    })
    expect(out.suggestedTones).toContain("dkg")
    expect(out.suggestedTones).not.toContain("Bk")
  })

  it("assort(base=有彩色g): 無彩色系トーンを返す", () => {
    const out = computeSuggest({
      theme: "chic",
      role: "assort",
      baseColor: { hueNumber: 10, toneSymbol: "g" }
    })
    expect(out.suggestedTones).toContain("Bk")
    expect(out.suggestedTones).not.toContain("g")
  })
})

describe("computeSuggest: dynamic", () => {
  it("全ロールが同一条件（5色相・4トーン）を返す", () => {
    const base = computeSuggest({ theme: "dynamic", role: "base" })
    const assort = computeSuggest({ theme: "dynamic", role: "assort" })
    const accent = computeSuggest({ theme: "dynamic", role: "accent" })
    expect(base.suggestedHues).toEqual(assort.suggestedHues)
    expect(assort.suggestedHues).toEqual(accent.suggestedHues)
    expect(base.suggestedHues).toEqual([2, 5, 8, 12, 18])
    expect(base.suggestedTones).toContain("v")
    expect(base.suggestedTones).toContain("Bk")
  })
})

describe("computeSuggest: warm-natural", () => {
  it("assort と accent が同一条件", () => {
    const assort = computeSuggest({
      theme: "warm-natural",
      role: "assort",
      baseColor: { hueNumber: 6, toneSymbol: "d" }
    })
    const accent = computeSuggest({
      theme: "warm-natural",
      role: "accent",
      baseColor: { hueNumber: 6, toneSymbol: "d" }
    })
    expect(assort.suggestedHues).toEqual(accent.suggestedHues)
    expect(assort.suggestedTones).toEqual(accent.suggestedTones)
  })
})

describe("computeSuggest: modern", () => {
  it("accent(assort=無彩色): 有彩色トーンを返す", () => {
    const out = computeSuggest({
      theme: "modern",
      role: "accent",
      assortColor: { hueNumber: null, toneSymbol: "dkGy" }
    })
    expect(out.suggestedTones).toContain("sf")
    expect(out.suggestedTones).toContain("v")
    expect(out.suggestedTones).not.toContain("Bk")
  })

  it("accent(assort=有彩色): 無彩色トーンを返す", () => {
    const out = computeSuggest({
      theme: "modern",
      role: "accent",
      assortColor: { hueNumber: 17, toneSymbol: "b" }
    })
    expect(out.suggestedTones).toContain("mGy")
    expect(out.suggestedTones).toContain("Bk")
    expect(out.suggestedTones).not.toContain("v")
  })
})

describe("computeSuggest: romantic", () => {
  it("assort(base=有彩色p): 類似色相（距離3以内）を返す", () => {
    const out = computeSuggest({
      theme: "romantic",
      role: "assort",
      baseColor: { hueNumber: 3, toneSymbol: "p" }
    })
    for (const h of out.suggestedHues) {
      expect(hueDistance(h, 3)).toBeLessThanOrEqual(3)
    }
  })

  it("assort(base=無彩色): p/lt トーンを返す", () => {
    const out = computeSuggest({
      theme: "romantic",
      role: "assort",
      baseColor: { hueNumber: null, toneSymbol: "ltGy" }
    })
    expect(out.suggestedTones).toContain("p")
    expect(out.suggestedTones).toContain("lt")
  })
})

describe("フォールバック", () => {
  it("サジェスト計算結果が空にならない（テーマ全体にフォールバック）", () => {
    // baseColor が指定されない状況でもクラッシュしない
    const out = computeSuggest({ theme: "classic", role: "assort" })
    expect(out.suggestedHues.length + out.suggestedTones.length).toBeGreaterThan(0)
  })
})
