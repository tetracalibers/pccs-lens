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
