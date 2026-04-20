import type { JisColorMapData, MapCell } from "./types"

export type MapPlacement = {
  cell: MapCell
  col: number
  row: number
  rowSpan: number
}

export type MapValueScale = {
  value: number
  row: number
  rowSpan: number
}

export type MapEquiAxis = {
  value: number
  col: number
  row: number
}

export type MapLayout = {
  placements: MapPlacement[]
  valueScale: MapValueScale[]
  equiAxis: MapEquiAxis[]
  totalRows: number
  totalCols: number
}

// 等明度軸を描画する基準明度
const EQUI_VALUE = 5.0

const vhKey = (value: number, hueRank: number) => `${value}:${hueRank}`
const occupyKey = (col: number, row: number) => `${col}:${row}`

export const buildMapLayout = (data: JisColorMapData): MapLayout => {
  const { valueRows, hueColumns, cells } = data

  // (value, hueRank)ごとの彩度昇順リスト: 同明度×同色相に複数セルがある場合のみ長さ>1
  const chromaSetByVH = new Map<string, Set<number>>()
  for (const cell of cells) {
    if (cell.chroma === null || cell.hueRank === null) continue
    const k = vhKey(cell.value, cell.hueRank)
    let set = chromaSetByVH.get(k)
    if (!set) {
      set = new Set<number>()
      chromaSetByVH.set(k, set)
    }
    set.add(cell.chroma)
  }
  const chromasByVH = new Map<string, number[]>()
  for (const [k, s] of chromaSetByVH) {
    chromasByVH.set(
      k,
      [...s].sort((a, b) => a - b)
    )
  }

  // 各明度行の開始行と行span（同明度×同色相に複数彩度がある場合、その最大数で拡張）
  const valueMeta = new Map<number, { startRow: number; rowSpan: number }>()
  let rowCursor = 1
  for (const vr of valueRows) {
    let span = 1
    for (const h of hueColumns) {
      const list = chromasByVH.get(vhKey(vr.value, h.rank))
      if (list && list.length > span) span = list.length
    }
    valueMeta.set(vr.value, { startRow: rowCursor, rowSpan: span })
    rowCursor += span
  }
  const totalRows = rowCursor - 1

  const hueIndex = new Map(hueColumns.map((h, i) => [h.rank, i]))

  const placements: MapPlacement[] = []
  const occupied = new Set<string>()

  const markOccupied = (col: number, row: number, rowSpan: number) => {
    for (let r = 0; r < rowSpan; r++) occupied.add(occupyKey(col, row + r))
  }

  for (const cell of cells) {
    const meta = valueMeta.get(cell.value)
    if (!meta) continue

    if (cell.kind === "jis" && cell.hueRank === null) {
      // 無彩色: 明度スケール列全体を占有
      placements.push({ cell, col: 1, row: meta.startRow, rowSpan: meta.rowSpan })
      markOccupied(1, meta.startRow, meta.rowSpan)
      continue
    }

    const { chroma, hueRank } = cell
    if (chroma === null || hueRank === null) continue
    const chromas = chromasByVH.get(vhKey(cell.value, hueRank)) ?? []
    const subIndex = chromas.indexOf(chroma)
    const hIdx = hueIndex.get(hueRank)
    if (subIndex < 0 || hIdx === undefined) continue
    const col = 2 + hIdx
    const row = meta.startRow + subIndex
    placements.push({ cell, col, row, rowSpan: 1 })
    markOccupied(col, row, 1)
  }

  // 明度スケール列のValueSwatch（無彩色で置き換えられていない明度）
  const valueScale: MapValueScale[] = []
  for (const vr of valueRows) {
    const meta = valueMeta.get(vr.value)!
    if (!occupied.has(occupyKey(1, meta.startRow))) {
      valueScale.push({ value: vr.value, row: meta.startRow, rowSpan: meta.rowSpan })
      markOccupied(1, meta.startRow, meta.rowSpan)
    }
  }

  // 等明度軸: value=EQUI_VALUEの行で空いたセルにValueSwatchを置く
  // ただし同色相に明度5.0の慣用色が複数ある場合、軸線が分断されるため描画しない
  const equiAxis: MapEquiAxis[] = []
  const equiMeta = valueMeta.get(EQUI_VALUE)
  const jisCountByHueAtEqui = new Map<number, number>()
  for (const c of cells) {
    if (c.kind === "jis" && c.value === EQUI_VALUE && c.hueRank !== null) {
      jisCountByHueAtEqui.set(c.hueRank, (jisCountByHueAtEqui.get(c.hueRank) ?? 0) + 1)
    }
  }
  const hasMultiJisSameHueAtEqui = [...jisCountByHueAtEqui.values()].some((n) => n >= 2)
  if (equiMeta && !hasMultiJisSameHueAtEqui) {
    for (let r = 0; r < equiMeta.rowSpan; r++) {
      const row = equiMeta.startRow + r
      for (let i = 0; i < hueColumns.length; i++) {
        const col = 2 + i
        if (!occupied.has(occupyKey(col, row))) {
          equiAxis.push({ value: EQUI_VALUE, col, row })
        }
      }
    }
  }

  return {
    placements,
    valueScale,
    equiAxis,
    totalRows,
    totalCols: 1 + hueColumns.length
  }
}
