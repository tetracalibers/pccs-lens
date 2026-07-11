import { describe, it, expect } from "vitest"
import { PCCS_CARD_199 } from "$lib/data/pccs"
import {
  generateRound,
  adjacentChromaticTones,
  isNearMissTone,
  toneNameJa,
  TARGET_TONES,
  CANDIDATE_COUNT,
  MIN_CORRECT,
  MAX_CORRECT
} from "./round"

/** 決定的な擬似乱数（mulberry32）。同一シードで同一列を返す。 */
const makeRng = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** distractor に混ざりうる無彩色トーン記号（代表 5 グレー）。 */
const NEUTRAL_SYMBOLS = ["W", "ltGy", "mGy", "dkGy", "Bk"]

/** 候補プールとして許される色（新配色カード199 の収録色）の notation 集合。 */
const CARD_199_NOTATIONS = new Set(PCCS_CARD_199.map((c) => c.notation))

describe("TARGET_TONES", () => {
  it("有彩色 11 トーン（s を含まない）", () => {
    expect(TARGET_TONES).toHaveLength(11)
    expect(TARGET_TONES).not.toContain("s")
    expect([...TARGET_TONES].sort()).toEqual(
      ["b", "d", "dk", "dkg", "dp", "g", "lt", "ltg", "p", "sf", "v"].sort()
    )
  })
})

describe("generateRound", () => {
  for (const target of TARGET_TONES) {
    describe(`お題 ${target}`, () => {
      // 多数シードで不変条件を検証する。
      const rounds = Array.from({ length: 300 }, (_, i) => generateRound(target, makeRng(i + 1)))

      it("候補は常に 8 枚", () => {
        for (const r of rounds) expect(r.candidates).toHaveLength(CANDIDATE_COUNT)
      })

      it("正解枚数は 1〜3 かつ isCorrect の数と一致", () => {
        for (const r of rounds) {
          expect(r.correctCount).toBeGreaterThanOrEqual(MIN_CORRECT)
          expect(r.correctCount).toBeLessThanOrEqual(MAX_CORRECT)
          expect(r.candidates.filter((c) => c.isCorrect).length).toBe(r.correctCount)
        }
      })

      it("正解札はお題トーンに一致する", () => {
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => c.isCorrect)) {
            expect(c.color.toneSymbol).toBe(target)
          }
        }
      })

      it("はずれ札にお題トーンは混入しない", () => {
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => !c.isCorrect)) {
            expect(c.color.toneSymbol).not.toBe(target)
          }
        }
      })

      it("候補は新配色カード199 のプール内（s・奇数色相の非 v 色は出ない）", () => {
        for (const r of rounds) {
          for (const c of r.candidates) {
            expect(CARD_199_NOTATIONS.has(c.color.notation)).toBe(true)
            expect(c.color.toneSymbol).not.toBe("s")
          }
        }
      })

      it("候補に重複した色はない", () => {
        for (const r of rounds) {
          const notations = r.candidates.map((c) => c.color.notation)
          expect(new Set(notations).size).toBe(notations.length)
        }
      })

      it("無彩色は多くても 1 枚で、お題トーンの明度水準に近いグレー", () => {
        for (const r of rounds) {
          const neutrals = r.candidates.filter((c) => c.color.isNeutral)
          expect(neutrals.length).toBeLessThanOrEqual(1)
          for (const c of neutrals) {
            expect(c.isCorrect).toBe(false)
            expect(NEUTRAL_SYMBOLS).toContain(c.color.toneSymbol)
          }
        }
      })
    })
  }

  it("はずれ札はなるべく隣接トーンから選ばれる（在庫が十分な限り全隣接）", () => {
    // 隣接有彩色トーンの在庫は各トーンで 8 枚のはずれ枠を十分に上回るため、
    // 有彩色はずれ札はすべて隣接トーンに収まる。
    for (const target of TARGET_TONES) {
      const adjacent = adjacentChromaticTones(target)
      for (let i = 0; i < 100; i++) {
        const r = generateRound(target, makeRng(i + 1))
        for (const c of r.candidates.filter((c) => !c.isCorrect && !c.color.isNeutral)) {
          expect(adjacent).toContain(c.color.toneSymbol)
        }
      }
    }
  })

  it("同一シードでは同一ラウンドを再現する", () => {
    const a = generateRound("lt", makeRng(42))
    const b = generateRound("lt", makeRng(42))
    expect(a.candidates.map((c) => c.color.notation)).toEqual(
      b.candidates.map((c) => c.color.notation)
    )
  })
})

describe("adjacentChromaticTones", () => {
  it("s を含まず、有彩色トーンのみを返す", () => {
    for (const target of TARGET_TONES) {
      const adjacent = adjacentChromaticTones(target)
      expect(adjacent).not.toContain("s")
      for (const tone of adjacent) expect(TARGET_TONES).toContain(tone)
    }
  })

  it("v は斜め隣接（b / dp）が取れる", () => {
    expect([...adjacentChromaticTones("v")].sort()).toEqual(["b", "dp"])
  })

  it("隣接関係は対称（a が b の隣接なら b も a の隣接）", () => {
    for (const target of TARGET_TONES) {
      for (const other of adjacentChromaticTones(target)) {
        expect(adjacentChromaticTones(other)).toContain(target)
      }
    }
  })
})

describe("isNearMissTone", () => {
  it("お題トーンの隣接トーンのみ true", () => {
    expect(isNearMissTone("lt", "sf")).toBe(true) // 縦隣接
    expect(isNearMissTone("lt", "b")).toBe(true) // 横隣接
    expect(isNearMissTone("d", "sf")).toBe(true) // 縦隣接
    expect(isNearMissTone("lt", "dkg")).toBe(false) // 遠いトーン
    expect(isNearMissTone("v", "g")).toBe(false)
  })

  it("無彩色トーンや null は「惜しい」に該当しない", () => {
    expect(isNearMissTone("p", "W")).toBe(false)
    expect(isNearMissTone("dkg", "Bk")).toBe(false)
    expect(isNearMissTone("lt", null)).toBe(false)
  })
})

describe("toneNameJa", () => {
  it("有彩色トーンの和名を返す", () => {
    expect(toneNameJa("sf")).toBe("ソフト")
    expect(toneNameJa("v")).toBe("ビビッド")
  })

  it("無彩色トーンの和名を返す", () => {
    expect(toneNameJa("W")).toBe("ホワイト")
    expect(toneNameJa("mGy")).toBe("ミディアムグレイ")
    expect(toneNameJa("Bk")).toBe("ブラック")
  })

  it("null は空文字", () => {
    expect(toneNameJa(null)).toBe("")
  })
})
