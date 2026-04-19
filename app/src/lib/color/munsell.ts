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

// 5原色の中心（rank 空間）: 5R=13, 5Y=33, 5G=53, 5B=73, 5P=93
const PRIMARY_HUE_CENTERS: { label: MunsellPrimaryHueLabel; rank: number }[] = [
  { label: "赤", rank: 13 },
  { label: "黄", rank: 33 },
  { label: "緑", rank: 53 },
  { label: "青", rank: 73 },
  { label: "紫", rank: 93 }
]

const cyclicDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 100
  return Math.min(d, 100 - d)
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
