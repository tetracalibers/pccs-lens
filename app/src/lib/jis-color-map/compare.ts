import {
  compareHueLabels,
  munsellPrimaryHueLabel,
  parseMunsell,
  type MunsellPrimaryHueLabel
} from "$lib/color/munsell"
import type { JISColor } from "$lib/data/jis-colors"

// 比較対象のパース結果（無彩色は chroma / hue / primaryLabel が null）
type ParsedTarget = {
  color: JISColor
  value: number
  chroma: number | null
  hue: string | null
  primaryLabel: MunsellPrimaryHueLabel | null
}

const parseTargets = (targets: JISColor[]): ParsedTarget[] => {
  const result: ParsedTarget[] = []
  for (const color of targets) {
    const parsed = parseMunsell(color.munsell)
    if (!parsed) continue
    if (parsed.isNeutral) {
      result.push({ color, value: parsed.value, chroma: null, hue: null, primaryLabel: null })
    } else {
      result.push({
        color,
        value: parsed.value,
        chroma: parsed.chroma,
        hue: parsed.hue,
        primaryLabel: munsellPrimaryHueLabel(parsed.hue)
      })
    }
  }
  return result
}

// 差分判定
// 有彩色同士の primaryLabel が2種以上なら色相に差分あり
export const hasHueDifference = (targets: JISColor[]): boolean => {
  const parsed = parseTargets(targets)
  const labels = new Set(
    parsed.map((p) => p.primaryLabel).filter((l): l is MunsellPrimaryHueLabel => l !== null)
  )
  return labels.size >= 2
}

export const hasValueDifference = (targets: JISColor[]): boolean => {
  const parsed = parseTargets(targets)
  const values = new Set(parsed.map((p) => p.value))
  return values.size >= 2
}

// 有彩色同士の chroma が2種以上なら彩度に差分あり
export const hasChromaDifference = (targets: JISColor[]): boolean => {
  const parsed = parseTargets(targets)
  const chromas = new Set(parsed.map((p) => p.chroma).filter((c): c is number => c !== null))
  return chromas.size >= 2
}

export type HueCompareDiagramData = {
  topLabel: MunsellPrimaryHueLabel
  bottomLabel: MunsellPrimaryHueLabel
}

/**
 * 色み比較図データ。
 * 有彩色 target の色相が完全に一致する場合のみ null を返す。
 * PCCS 5原色（4R/5Y/3G/3PB/7P）を基準に、両端それぞれにラベルを付ける。
 * 同じ原色圏内なら中心に近い方が原色ラベル、遠い方は偏り方向の隣接原色ラベル。
 * 例: 1PB と 3PB なら、3PB は 青（中心）、1PB は 緑（青より緑側へ偏る）。
 */
export const buildHueCompareDiagram = (targets: JISColor[]): HueCompareDiagramData | null => {
  const parsed = parseTargets(targets)
  const chromatic = parsed.filter(
    (p): p is ParsedTarget & { hue: string; primaryLabel: MunsellPrimaryHueLabel } =>
      p.hue !== null && p.primaryLabel !== null
  )
  if (chromatic.length < 2) return null
  const uniqHues = new Set(chromatic.map((p) => p.hue))
  if (uniqHues.size < 2) return null

  const top = chromatic[0]
  const last = chromatic[chromatic.length - 1]
  // 両端が同一色相でも中間に異なる色相があれば、それを相手として方向を算出する
  const partner = last.hue !== top.hue ? last : chromatic.find((p) => p.hue !== top.hue)!
  const labels = compareHueLabels(top.hue, partner.hue)
  if (!labels) return null
  return { topLabel: labels.a, bottomLabel: labels.b }
}

export type ValueCompareDiagramData = {
  topLabel: "高明度" | "低明度"
  middleLabel: "高明度" | "低明度" | null
  bottomLabel: "高明度" | "低明度"
}

const isMonotone = (values: number[]): boolean => {
  if (values.length < 2) return true
  let ascending = true
  let descending = true
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) ascending = false
    if (values[i] > values[i - 1]) descending = false
  }
  return ascending || descending
}

export const buildValueCompareDiagram = (targets: JISColor[]): ValueCompareDiagramData | null => {
  const parsed = parseTargets(targets)
  if (parsed.length < 2) return null
  const values = parsed.map((p) => p.value)
  const uniq = new Set(values)
  if (uniq.size < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const mid = (min + max) / 2
  const labelFor = (v: number): "高明度" | "低明度" => (v >= mid ? "高明度" : "低明度")

  const topLabel = labelFor(values[0])
  const bottomLabel = labelFor(values[values.length - 1])
  let middleLabel: "高明度" | "低明度" | null = null

  if (parsed.length >= 3 && !isMonotone(values)) {
    // 中間 target の平均値が中央より高いか低いかで中間ラベルを決定
    const middles = values.slice(1, -1)
    const avg = middles.reduce((a, b) => a + b, 0) / middles.length
    middleLabel = avg >= mid ? "高明度" : "低明度"
  }

  return { topLabel, middleLabel, bottomLabel }
}

export type ChromaCompareDiagramData = {
  topLabel: "高彩度" | "低彩度"
  middleLabel: "高彩度" | "低彩度" | null
  bottomLabel: "高彩度" | "低彩度"
}

export const buildChromaCompareDiagram = (targets: JISColor[]): ChromaCompareDiagramData | null => {
  const parsed = parseTargets(targets)
  const chromatic = parsed.filter((p): p is ParsedTarget & { chroma: number } => p.chroma !== null)
  if (chromatic.length < 2) return null
  const chromas = chromatic.map((p) => p.chroma)
  const uniq = new Set(chromas)
  if (uniq.size < 2) return null

  const min = Math.min(...chromas)
  const max = Math.max(...chromas)
  const mid = (min + max) / 2

  const topLabel = "高彩度" as const
  const bottomLabel = "低彩度" as const
  let middleLabel: "高彩度" | "低彩度" | null = null

  if (chromatic.length >= 3 && !isMonotone(chromas)) {
    const middles = chromas.slice(1, -1)
    const avg = middles.reduce((a, b) => a + b, 0) / middles.length
    middleLabel = avg >= mid ? "高彩度" : "低彩度"
  }

  return { topLabel, middleLabel, bottomLabel }
}
