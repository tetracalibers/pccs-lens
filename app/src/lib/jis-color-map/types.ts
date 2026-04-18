import type { JISColor } from "$lib/data/jis-colors"
import type { PCCSColor } from "$lib/data/types"

export type MapHueColumn = {
  hue: string
  rank: number
}

export type MapValueRow = {
  value: number
  // この明度に現れる彩度の昇順リスト。空配列なら等明度スウォッチのみの行。
  chromas: number[]
}

export type MapJisCell = {
  kind: "jis"
  value: number
  // 無彩色なら null
  chroma: number | null
  // 無彩色なら null（明度スケール列に配置）
  hueRank: number | null
  colors: JISColor[]
  pccsHint?: PCCSColor
}

export type MapPccsCell = {
  kind: "pccs"
  value: number
  chroma: number
  hueRank: number
  pccs: PCCSColor
}

export type MapCell = MapJisCell | MapPccsCell

export type JisColorMapData = {
  valueRows: MapValueRow[]
  hueColumns: MapHueColumn[]
  cells: MapCell[]
  minValue: number
  maxValue: number
}
