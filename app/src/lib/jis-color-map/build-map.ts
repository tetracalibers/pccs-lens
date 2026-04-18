import { munsellHueRank, parseMunsell, type MunsellColor } from "$lib/color/munsell"
import {
  getJisColorsByGroup,
  getSubfamiliesByGroup,
  type JISColor,
  type JISColorGroupId,
  type JISSubfamily
} from "$lib/data/jis-colors"
import { PCCS_V24 } from "$lib/data/pccs"
import type { PCCSColor } from "$lib/data/types"
import type { JisColorMapData, MapCell, MapHueColumn, MapValueRow } from "./types"

const VALUE_STEP = 0.5
// 等明度軸として必ずマップに含めるマンセル明度
const REQUIRED_VALUE = 5.0

type ParsedColor<T> = {
  ref: T
  parsed: MunsellColor
}

const parseColors = <T extends { munsell?: string }>(colors: T[]): ParsedColor<T>[] => {
  const result: ParsedColor<T>[] = []
  for (const color of colors) {
    if (!color.munsell) continue
    const parsed = parseMunsell(color.munsell)
    if (parsed) result.push({ ref: color, parsed })
  }
  return result
}

const computeHintRange = (subfamilies: JISSubfamily[]): { from: number; to: number } | null => {
  if (subfamilies.length === 0) return null
  let from = Infinity
  let to = -Infinity
  for (const sub of subfamilies) {
    if (sub.hintPCCSHue.from < from) from = sub.hintPCCSHue.from
    if (sub.hintPCCSHue.to > to) to = sub.hintPCCSHue.to
  }
  return { from, to }
}

const collectValues = (parsed: ParsedColor<unknown>[]): { min: number; max: number } => {
  let min = Infinity
  let max = -Infinity
  for (const { parsed: p } of parsed) {
    if (p.value < min) min = p.value
    if (p.value > max) max = p.value
  }
  if (min > REQUIRED_VALUE) min = REQUIRED_VALUE
  if (max < REQUIRED_VALUE) max = REQUIRED_VALUE
  return { min, max }
}

const snapValue = (v: number): number => Math.round(v / VALUE_STEP) * VALUE_STEP

const buildValueList = (min: number, max: number): number[] => {
  const result: number[] = []
  for (let v = min; v <= max + 1e-9; v += VALUE_STEP) {
    result.push(Number(v.toFixed(1)))
  }
  return result
}

const buildHueColumns = (parsed: ParsedColor<unknown>[]): MapHueColumn[] => {
  const map = new Map<string, number>()
  for (const { parsed: p } of parsed) {
    if (p.isNeutral) continue
    if (map.has(p.hue)) continue
    const rank = munsellHueRank(p.hue)
    if (rank === null) continue
    map.set(p.hue, rank)
  }
  return [...map.entries()].map(([hue, rank]) => ({ hue, rank })).sort((a, b) => a.rank - b.rank)
}

const buildValueRows = (parsed: ParsedColor<unknown>[], values: number[]): MapValueRow[] => {
  const chromasByValue = new Map<number, Set<number>>()
  for (const v of values) chromasByValue.set(v, new Set())
  for (const { parsed: p } of parsed) {
    if (p.isNeutral) continue
    const v = snapValue(p.value)
    chromasByValue.get(v)?.add(p.chroma)
  }
  return values
    .slice()
    .sort((a, b) => b - a)
    .map((value) => ({
      value,
      chromas: [...(chromasByValue.get(value) ?? [])].sort((a, b) => a - b)
    }))
}

const buildCells = (
  parsedJis: ParsedColor<JISColor>[],
  parsedPccs: ParsedColor<PCCSColor>[]
): MapCell[] => {
  const jisCellsByKey = new Map<
    string,
    {
      value: number
      chroma: number | null
      hueRank: number | null
      colors: JISColor[]
      pccsHint?: PCCSColor
    }
  >()

  for (const { ref, parsed } of parsedJis) {
    const key = ref.munsell
    const existing = jisCellsByKey.get(key)
    if (existing) {
      existing.colors.push(ref)
      continue
    }
    const value = snapValue(parsed.value)
    if (parsed.isNeutral) {
      jisCellsByKey.set(key, { value, chroma: null, hueRank: null, colors: [ref] })
    } else {
      const hueRank = munsellHueRank(parsed.hue)
      if (hueRank === null) continue
      jisCellsByKey.set(key, { value, chroma: parsed.chroma, hueRank, colors: [ref] })
    }
  }

  const pccsOnlyCells: MapCell[] = []

  for (const { ref, parsed } of parsedPccs) {
    if (parsed.isNeutral) continue
    const key = ref.munsell!
    const jisCell = jisCellsByKey.get(key)
    if (jisCell) {
      jisCell.pccsHint = ref
      continue
    }
    const hueRank = munsellHueRank(parsed.hue)
    if (hueRank === null) continue
    pccsOnlyCells.push({
      kind: "pccs",
      value: snapValue(parsed.value),
      chroma: parsed.chroma,
      hueRank,
      pccs: ref
    })
  }

  const jisCells: MapCell[] = [...jisCellsByKey.values()].map((c) => ({ kind: "jis", ...c }))
  return [...jisCells, ...pccsOnlyCells]
}

export const buildJisColorMap = (groupId: JISColorGroupId): JisColorMapData => {
  const jisColors = getJisColorsByGroup(groupId)
  const subfamilies = getSubfamiliesByGroup(groupId)
  const hintRange = computeHintRange(subfamilies)
  const helpPccsList = hintRange
    ? PCCS_V24.filter(
        (p) => p.hueNumber !== null && p.hueNumber >= hintRange.from && p.hueNumber <= hintRange.to
      )
    : []

  const parsedJis = parseColors(jisColors)
  const parsedPccs = parseColors(helpPccsList)
  const allParsed: ParsedColor<unknown>[] = [...parsedJis, ...parsedPccs]

  const { min, max } = collectValues(allParsed)
  const values = buildValueList(min, max)
  const valueRows = buildValueRows(allParsed, values)
  const hueColumns = buildHueColumns(allParsed)
  const cells = buildCells(parsedJis, parsedPccs)

  return { valueRows, hueColumns, cells, minValue: min, maxValue: max }
}
