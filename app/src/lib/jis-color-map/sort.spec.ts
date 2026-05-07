import { describe, expect, it, vi } from "vitest"
import { sortJisColors } from "./sort"
import type { JISColor } from "$lib/data/jis-colors"

const makeColor = (id: string, munsell: string): JISColor => ({
  id,
  name: id,
  reading: "",
  systematicName: "",
  colorDescription: "",
  originDescription: "",
  rgb: "rgb(0, 0, 0)",
  hex: "#000000",
  examLevel: null,
  munsell,
  iconKey: "bird",
  approximatePccs: [{ notation: "v2", deltaE: 0 }]
})

describe("sortJisColors", () => {
  it("色相ランク昇順でソートする（起点 2RP）", () => {
    const input = [
      makeColor("red", "5R 5/10"),
      makeColor("purple", "10P 5/10"),
      makeColor("rp", "2RP 5/10")
    ]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["rp", "red", "purple"])
  })

  it("同色相なら明度降順", () => {
    const input = [
      makeColor("dark", "5R 3/10"),
      makeColor("light", "5R 7/10"),
      makeColor("mid", "5R 5/10")
    ]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["light", "mid", "dark"])
  })

  it("同色相・同明度なら彩度降順", () => {
    const input = [
      makeColor("low", "5R 5/4"),
      makeColor("high", "5R 5/14"),
      makeColor("mid", "5R 5/8")
    ]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["high", "mid", "low"])
  })

  it("無彩色は有彩色の末尾に配置される", () => {
    const input = [
      makeColor("neutral", "N 5"),
      makeColor("red", "5R 5/10"),
      makeColor("purple", "10P 5/10")
    ]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["red", "purple", "neutral"])
  })

  it("無彩色は明度降順でソートされる", () => {
    const input = [makeColor("n3", "N 3"), makeColor("n9", "N 9"), makeColor("n5", "N 5")]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["n9", "n5", "n3"])
  })

  it("全無彩色のみの入力でも明度降順で返る", () => {
    const input = [makeColor("n2", "N 2"), makeColor("n8", "N 8"), makeColor("n5", "N 5")]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["n8", "n5", "n2"])
  })

  it("不正なマンセル値の色は末尾に退避される", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const input = [
      makeColor("valid", "5R 5/10"),
      makeColor("invalid", "invalid-munsell"),
      makeColor("neutral", "N 5")
    ]
    const result = sortJisColors(input)
    expect(result.map((c) => c.id)).toEqual(["valid", "neutral", "invalid"])
    consoleErrorSpy.mockRestore()
  })

  it("空配列を渡すと空配列を返す", () => {
    expect(sortJisColors([])).toEqual([])
  })
})
