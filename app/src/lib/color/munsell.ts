// Munsell notation: "H V/C" (e.g. "5R 4/14")

export type MunsellColor = {
  hue: string
  value: number
  chroma: number
}

export const parseMunsell = (munsell: string): MunsellColor | null => {
  const match = munsell.match(/^(\d+(?:\.\d+)?[A-Z]+)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (!match) {
    console.error(`Invalid Munsell notation: ${munsell}`)
    return null
  }
  return {
    hue: match[1],
    value: parseFloat(match[2]),
    chroma: parseFloat(match[3])
  }
}
