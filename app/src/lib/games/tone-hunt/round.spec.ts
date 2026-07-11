import { describe, it, expect } from "vitest"
import {
  generateRound,
  toneClass,
  TARGET_TONES,
  TONE_CLASS_LABEL,
  CANDIDATE_COUNT,
  MIN_CORRECT,
  MAX_CORRECT,
  type Mode
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

const modes: Mode[] = ["tint", "shade", "mid"]

describe("generateRound", () => {
  for (const mode of modes) {
    describe(mode, () => {
      // 多数シードで不変条件を検証する。
      const rounds = Array.from({ length: 300 }, (_, i) => generateRound(mode, makeRng(i + 1)))

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

      it("正解札は選択中モードの正解トーン集合に属す", () => {
        const targets = TARGET_TONES[mode]
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => c.isCorrect)) {
            expect(c.color.toneSymbol).not.toBeNull()
            expect(targets).toContain(c.color.toneSymbol)
          }
        }
      })

      it("はずれ札に正解トーンは混入しない", () => {
        const targets = TARGET_TONES[mode]
        for (const r of rounds) {
          for (const c of r.candidates.filter((c) => !c.isCorrect)) {
            expect(targets).not.toContain(c.color.toneSymbol)
          }
        }
      })

      it("候補に無彩色・s トーンは含まれない", () => {
        for (const r of rounds) {
          for (const c of r.candidates) {
            expect(c.color.isNeutral).toBe(false)
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

      it("退化ラウンド（正解 0 枚）は発生しない", () => {
        for (const r of rounds) {
          expect(r.correctCount).toBeGreaterThanOrEqual(1)
        }
      })
    })
  }

  it("純色 v はどのモードでも常にはずれ札", () => {
    for (const mode of modes) {
      for (let i = 0; i < 300; i++) {
        const r = generateRound(mode, makeRng(i + 1))
        for (const c of r.candidates.filter((c) => c.color.toneSymbol === "v")) {
          expect(c.isCorrect).toBe(false)
        }
      }
    }
  })

  it("同一シードでは同一ラウンドを再現する", () => {
    const a = generateRound("mid", makeRng(42))
    const b = generateRound("mid", makeRng(42))
    expect(a.candidates.map((c) => c.color.notation)).toEqual(
      b.candidates.map((c) => c.color.notation)
    )
  })
})

describe("toneClass", () => {
  it("明清色・暗清色・中間色・純色を正しく分類する", () => {
    expect(toneClass("b")).toBe("tint")
    expect(toneClass("lt")).toBe("tint")
    expect(toneClass("p")).toBe("tint")
    expect(toneClass("dk")).toBe("shade")
    expect(toneClass("dkg")).toBe("shade")
    expect(toneClass("dp")).toBe("shade")
    expect(toneClass("sf")).toBe("mid")
    expect(toneClass("d")).toBe("mid")
    expect(toneClass("ltg")).toBe("mid")
    expect(toneClass("g")).toBe("mid")
    expect(toneClass("s")).toBe("mid")
    expect(toneClass("v")).toBe("vivid")
  })

  it("未知・無彩色は null", () => {
    expect(toneClass(null)).toBeNull()
    expect(toneClass("W")).toBeNull()
  })

  it("各モードの正解トーンは対応する分類に一致する", () => {
    const classByMode: Record<Mode, keyof typeof TONE_CLASS_LABEL> = {
      tint: "tint",
      shade: "shade",
      mid: "mid"
    }
    for (const mode of modes) {
      for (const tone of TARGET_TONES[mode]) {
        expect(toneClass(tone)).toBe(classByMode[mode])
      }
    }
  })
})
