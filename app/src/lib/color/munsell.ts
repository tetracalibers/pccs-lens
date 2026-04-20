// Munsell notation: "H V/C" (e.g. "5R 4/14")

export type MunsellColor =
  | {
      isNeutral: false
      hue: string
      value: number
      chroma: number
    }
  | {
      isNeutral: true
      value: number
    }

export const parseMunsell = (munsell: string): MunsellColor | null => {
  const neutralMatch = munsell.match(/^N\s*(\d+(?:\.\d+)?)$/)
  if (neutralMatch) {
    return {
      isNeutral: true,
      value: parseFloat(neutralMatch[1])
    }
  }
  const match = munsell.match(/^(\d+(?:\.\d+)?[A-Z]+)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (!match) {
    console.error(`Invalid Munsell notation: ${munsell}`)
    return null
  }
  return {
    isNeutral: false,
    hue: match[1],
    value: parseFloat(match[2]),
    chroma: parseFloat(match[3])
  }
}

// 2RPを起点として色相環を一周[0, 100)にマップするオフセット。
// RP→R→YR→Y→GY→G→BG→B→PB→Pの順に色相環を進む。
const HUE_FAMILY_OFFSET: Record<string, number> = {
  RP: 0,
  R: 10,
  YR: 20,
  Y: 30,
  GY: 40,
  G: 50,
  BG: 60,
  B: 70,
  PB: 80,
  P: 90
}

const HUE_RANK_START_OFFSET = 2

/**
 * マンセル色相表記（例: "10RP", "4R", "2.5YR"）を[0, 100)のランクに変換する。
 * 2RPを起点として色相環順に並ぶ。ソートキーとして利用できる。
 */
export const munsellHueRank = (hue: string): number | null => {
  const match = hue.match(/^(\d+(?:\.\d+)?)([A-Z]+)$/)
  if (!match) {
    console.error(`Invalid Munsell hue: ${hue}`)
    return null
  }
  const hueNumber = parseFloat(match[1])
  const family = match[2]
  const offset = HUE_FAMILY_OFFSET[family]
  if (offset === undefined) {
    console.error(`Unknown Munsell hue family: ${family}`)
    return null
  }
  return (offset + hueNumber - HUE_RANK_START_OFFSET + 100) % 100
}

/**
 * マンセル色相表記から色相ファミリー（"R" / "YR" / "Y" / ... / "RP"）を取り出す。
 * 無彩色や不正値は null。
 */
export const munsellHueFamily = (hue: string): string | null => {
  const match = hue.match(/^\d+(?:\.\d+)?([A-Z]+)$/)
  if (!match) return null
  const family = match[1]
  return family in HUE_FAMILY_OFFSET ? family : null
}

export type MunsellPrimaryHueLabel = "赤" | "黄" | "緑" | "青" | "紫"

export const PRIMARY_HUE_LABEL_SLUG: Record<MunsellPrimaryHueLabel, string> = {
  赤: "red",
  黄: "yellow",
  緑: "green",
  青: "blue",
  紫: "purple"
}

// PCCSの心理的5原色に対応するマンセル色相の rank。
// PCCS 2:R=4R(12), 8:Y=5Y(33), 12:G=3G(51), 18:B=3PB(81), 22:P=7P(95)。
// 色相環順（昇順）に並べておき、隣接原色の取得はこの配列で行う。
const PRIMARY_HUE_CENTERS: { label: MunsellPrimaryHueLabel; rank: number }[] = [
  { label: "赤", rank: 12 },
  { label: "黄", rank: 33 },
  { label: "緑", rank: 51 },
  { label: "青", rank: 81 },
  { label: "紫", rank: 95 }
]

const cyclicDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 100
  return Math.min(d, 100 - d)
}

// center → rank の符号付き最短差（(-50, 50] に正規化）。
const cyclicSignedOffset = (center: number, rank: number): number => {
  const diff = (((rank - center) % 100) + 100) % 100
  return diff <= 50 ? diff : diff - 100
}

/**
 * マンセル色相表記を、PCCS互換の5原色ラベル（赤/黄/緑/青/紫）に最近傍で丸める。
 * 無彩色や不正値は null。
 */
export const munsellPrimaryHueLabel = (hue: string): MunsellPrimaryHueLabel | null => {
  const rank = munsellHueRank(hue)
  if (rank === null) return null
  let best: MunsellPrimaryHueLabel = PRIMARY_HUE_CENTERS[0].label
  let bestDist = Infinity
  for (const center of PRIMARY_HUE_CENTERS) {
    const d = cyclicDistance(rank, center.rank)
    if (d < bestDist) {
      bestDist = d
      best = center.label
    }
  }
  return best
}

type NearestPrimaryInfo = {
  index: number
  label: MunsellPrimaryHueLabel
  distance: number
  offsetSign: 1 | -1 | 0
}

const nearestPrimaryInfo = (rank: number): NearestPrimaryInfo => {
  let bestIndex = 0
  let bestDistance = Infinity
  let bestOffset = 0
  for (let i = 0; i < PRIMARY_HUE_CENTERS.length; i++) {
    const d = cyclicDistance(rank, PRIMARY_HUE_CENTERS[i].rank)
    if (d < bestDistance) {
      bestDistance = d
      bestIndex = i
      bestOffset = cyclicSignedOffset(PRIMARY_HUE_CENTERS[i].rank, rank)
    }
  }
  return {
    index: bestIndex,
    label: PRIMARY_HUE_CENTERS[bestIndex].label,
    distance: bestDistance,
    offsetSign: bestOffset > 0 ? 1 : bestOffset < 0 ? -1 : 0
  }
}

const adjacentPrimaryLabel = (index: number, offsetSign: 1 | -1 | 0): MunsellPrimaryHueLabel => {
  if (offsetSign === 0) return PRIMARY_HUE_CENTERS[index].label
  const n = PRIMARY_HUE_CENTERS.length
  const adj = offsetSign === 1 ? (index + 1) % n : (index - 1 + n) % n
  return PRIMARY_HUE_CENTERS[adj].label
}

// PCCS 24色相のセル幅の半分。原色中心からこの距離以内にあれば、その原色セル内とみなす。
const PCCS_HUE_HALF_CELL = 100 / 48

const inPrimaryCell = (rank: number, primaryIndex: number): boolean => {
  return cyclicDistance(rank, PRIMARY_HUE_CENTERS[primaryIndex].rank) <= PCCS_HUE_HALF_CELL
}

// 最近傍原色が異なる endpoint のラベル決定。
// セル内なら原色ラベル。セル外でも偏り方向が相手の原色側を指していれば原色ラベル
// （自身の原色側に留まっているとみなす）。それ以外は偏り方向の隣接原色ラベル。
const labelForDifferentPrimary = (
  rank: number,
  info: NearestPrimaryInfo,
  partnerIndex: number
): MunsellPrimaryHueLabel => {
  if (inPrimaryCell(rank, info.index)) return info.label
  const n = PRIMARY_HUE_CENTERS.length
  const adjIndex =
    info.offsetSign === 1
      ? (info.index + 1) % n
      : info.offsetSign === -1
        ? (info.index - 1 + n) % n
        : info.index
  if (adjIndex === partnerIndex) return info.label
  return adjacentPrimaryLabel(info.index, info.offsetSign)
}

/**
 * 2つのマンセル色相に対し、PCCS 5原色ラベル（赤/黄/緑/青/紫）を比較用に付与する。
 * rank が完全一致する場合は null。
 *
 * 最近傍原色が異なる場合（labelForDifferentPrimary 参照）：
 * - PCCS セル内なら原色ラベル。
 * - セル外でも偏り方向が相手の原色側なら原色ラベル（例: 4GY vs 5GY → 黄/緑）。
 * - それ以外は偏り方向の隣接原色ラベル（例: 5YR vs 2.5G → 赤/緑）。
 * - 両者とも同じ中間原色に寄せた衝突時は、それぞれの最近傍原色にフォールバック。
 *
 * 最近傍原色が同じ場合：
 * - 一方が中心（offsetSign===0）: 中心側に原色ラベル、他方に偏り方向の隣接原色ラベル。
 *   例: 3PB(=青中心)と1PB → 青/緑。
 * - 両者が中心を挟んで反対側（straddle）: 両者とも偏り方向の隣接原色ラベル。
 *   例: 10R(黄側)と10RP(紫側) → 黄/紫、7.5P(赤側)と5P(青側) → 赤/青。
 * - 同じ側にあり距離が異なる: 中心に近い方が原色、遠い方が偏り方向の隣接原色ラベル。
 * - 同じ側で距離も等しい: null（比較不能）。
 */
export const compareHueLabels = (
  hueA: string,
  hueB: string
): { a: MunsellPrimaryHueLabel; b: MunsellPrimaryHueLabel } | null => {
  const rankA = munsellHueRank(hueA)
  const rankB = munsellHueRank(hueB)
  if (rankA === null || rankB === null) return null
  if (rankA === rankB) return null

  const infoA = nearestPrimaryInfo(rankA)
  const infoB = nearestPrimaryInfo(rankB)

  if (infoA.index !== infoB.index) {
    const labelA = labelForDifferentPrimary(rankA, infoA, infoB.index)
    const labelB = labelForDifferentPrimary(rankB, infoB, infoA.index)
    if (labelA === labelB) return { a: infoA.label, b: infoB.label }
    return { a: labelA, b: labelB }
  }

  if (infoA.offsetSign === 0) {
    return { a: infoA.label, b: adjacentPrimaryLabel(infoB.index, infoB.offsetSign) }
  }
  if (infoB.offsetSign === 0) {
    return { a: adjacentPrimaryLabel(infoA.index, infoA.offsetSign), b: infoB.label }
  }
  if (infoA.offsetSign !== infoB.offsetSign) {
    return {
      a: adjacentPrimaryLabel(infoA.index, infoA.offsetSign),
      b: adjacentPrimaryLabel(infoB.index, infoB.offsetSign)
    }
  }
  if (infoA.distance < infoB.distance) {
    return { a: infoA.label, b: adjacentPrimaryLabel(infoB.index, infoB.offsetSign) }
  }
  if (infoA.distance > infoB.distance) {
    return { a: adjacentPrimaryLabel(infoA.index, infoA.offsetSign), b: infoB.label }
  }
  return null
}
