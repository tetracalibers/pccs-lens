import { describe, it, expect } from "vitest"
import {
  generateRound,
  isNearMiss,
  CANDIDATE_COUNT,
  MIN_CORRECT,
  MAX_CORRECT,
  NEAR_MISS_THRESHOLD,
  type Difficulty
} from "./round"
import { parseMunsell } from "$lib/color/munsell"

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

const valueOf = (munsell: string): number => {
  const m = parseMunsell(munsell)
  if (!m) throw new Error(`invalid munsell: ${munsell}`)
  return m.value
}

const isNeutral = (munsell: string): boolean => {
  const m = parseMunsell(munsell)
  return m !== null && m.isNeutral
}

const difficulties: Difficulty[] = ["beginner", "advanced"]

describe("generateRound", () => {
  for (const difficulty of difficulties) {
    describe(difficulty, () => {
      // 多数シードで不変条件を検証する。
      const rounds = Array.from({ length: 300 }, (_, i) => generateRound(difficulty, makeRng(i + 1)))

      it("候補は常に 8 枚", () => {
        for (const r of rounds) expect(r.candidates).toHaveLength(CANDIDATE_COUNT)
      })

      it("正解枚数は 1〜3 かつ isCorrect の数と一致", () => {
        for (const r of rounds) {
          expect(r.correctCount).toBeGreaterThanOrEqual(MIN_CORRECT)
          expect(r.correctCount).toBeLessThanOrEqual(MAX_CORRECT)
          const actual = r.candidates.filter((c) => c.isCorrect).length
          expect(actual).toBe(r.correctCount)
        }
      })

      it("正解札は基準色と同 Value", () => {
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => c.isCorrect)) {
            expect(c.value).toBeCloseTo(r.baseValue, 6)
          }
        }
      })

      it("はずれ札は基準色と別 Value で、差が 0.5 または 1.0", () => {
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => !c.isCorrect)) {
            const diff = Math.abs(c.value - r.baseValue)
            expect(diff).toBeGreaterThan(0)
            expect([0.5, 1.0].some((d) => Math.abs(diff - d) < 1e-9)).toBe(true)
          }
        }
      })

      it("基準色は候補に含まれない", () => {
        for (const r of rounds) {
          expect(r.candidates.some((c) => c.color.id === r.base.id)).toBe(false)
        }
      })

      it("候補に重複した色はない", () => {
        for (const r of rounds) {
          const ids = r.candidates.map((c) => c.color.id)
          expect(new Set(ids).size).toBe(ids.length)
        }
      })

      it("基準色の Value が候補の value と整合", () => {
        for (const r of rounds) {
          expect(r.baseValue).toBeCloseTo(valueOf(r.base.munsell), 6)
        }
      })
    })
  }

  it("初級の基準色は必ず有彩色（無彩色は除外）", () => {
    for (let i = 0; i < 300; i++) {
      const r = generateRound("beginner", makeRng(i + 1))
      expect(isNeutral(r.base.munsell)).toBe(false)
    }
  })

  it("同一シードでは同一ラウンドを再現する", () => {
    const a = generateRound("advanced", makeRng(42))
    const b = generateRound("advanced", makeRng(42))
    expect(a.base.id).toBe(b.base.id)
    expect(a.candidates.map((c) => c.color.id)).toEqual(b.candidates.map((c) => c.color.id))
  })
})

describe("isNearMiss", () => {
  it("明度差 0.5 は惜しい", () => {
    expect(isNearMiss(5.0, 5.5)).toBe(true)
    expect(isNearMiss(5.0, 4.5)).toBe(true)
  })

  it("明度差 1.0 は惜しくない", () => {
    expect(isNearMiss(5.0, 6.0)).toBe(false)
  })

  it("完全一致（差 0）は惜しいではない", () => {
    expect(isNearMiss(5.0, 5.0)).toBe(false)
  })

  it("しきい値の定義と整合", () => {
    expect(NEAR_MISS_THRESHOLD).toBe(0.5)
  })
})
