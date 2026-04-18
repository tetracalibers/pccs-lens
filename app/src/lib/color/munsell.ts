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

// 10RPを起点（0）として色相環を一周[0, 100)にマップするオフセット。
// R→YR→Y→GY→G→BG→B→PB→P→RPの順に色相環を進む。
const HUE_FAMILY_OFFSET: Record<string, number> = {
  R: 0,
  YR: 10,
  Y: 20,
  GY: 30,
  G: 40,
  BG: 50,
  B: 60,
  PB: 70,
  P: 80,
  RP: 90
}

/**
 * マンセル色相表記（例: "10RP", "4R", "2.5YR"）を[0, 100)のランクに変換する。
 * 10RPを起点（0）として色相環順に並ぶ。ソートキーとして利用できる。
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
  return (offset + hueNumber) % 100
}
