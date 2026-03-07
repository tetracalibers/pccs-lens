import { describe, it, expect } from "vitest"
import { deltaE2000 } from "./ciede2000"

describe("deltaE2000", () => {
  it("同一色はΔE₀₀ = 0", () => {
    const lab = { L: 50, a: 25, b: -30 }
    expect(deltaE2000(lab, lab)).toBeCloseTo(0, 10)
  })

  it("黒と白の差は大きい（> 90）", () => {
    const black = { L: 0, a: 0, b: 0 }
    const white = { L: 100, a: 0, b: 0 }
    expect(deltaE2000(black, white)).toBeGreaterThan(90)
  })

  it("対称性：deltaE(A,B) === deltaE(B,A)", () => {
    const lab1 = { L: 50, a: 20, b: -10 }
    const lab2 = { L: 60, a: -5, b: 30 }
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(deltaE2000(lab2, lab1), 10)
  })

  it("既知テストベクタ（Sharma 2005, pair 1）: ΔE₀₀ ≈ 2.0425", () => {
    // G. Sharma, W. Wu, E. N. Dalal (2005) Table 1, pair 1
    const lab1 = { L: 50.0, a: 2.6772, b: -79.7751 }
    const lab2 = { L: 50.0, a: 0.0, b: -82.7485 }
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(2.0425, 3)
  })

  it("既知テストベクタ（Sharma 2005, pair 2）: ΔE₀₀ ≈ 2.8615", () => {
    const lab1 = { L: 50.0, a: 3.1571, b: -77.2803 }
    const lab2 = { L: 50.0, a: 0.0, b: -82.7485 }
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(2.8615, 3)
  })

  it("無彩色で明度差のみ（Lbar=50 → SL=1）: ΔE₀₀ = 2.0", () => {
    // L1=49, L2=51, a=b=0 → dLp=2, SL=1, SC=SH=1, RT=0 → dE=2.0
    const lab1 = { L: 49.0, a: 0.0, b: 0.0 }
    const lab2 = { L: 51.0, a: 0.0, b: 0.0 }
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(2.0, 3)
  })
})
