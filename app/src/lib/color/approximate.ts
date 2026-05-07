import type { PCCSColor, ApproximateResult } from "$lib/data/types"
import type { JISColor, JISApproximateResult } from "$lib/data/jis-colors"
import chroma from "chroma-js"

export function findClosestPccs(
  inputHex: string,
  colors: PCCSColor[],
  topN: number
): ApproximateResult[] {
  const results: ApproximateResult[] = colors.map((color) => ({
    color,
    deltaE: chroma.deltaE(inputHex, color.hex)
  }))

  results.sort((a, b) => a.deltaE - b.deltaE)

  return results.slice(0, topN)
}

export function findClosestJis(
  inputHex: string,
  colors: JISColor[],
  topN: number
): JISApproximateResult[] {
  const results: JISApproximateResult[] = colors.map((color) => ({
    color,
    deltaE: chroma.deltaE(inputHex, color.rgb)
  }))

  results.sort((a, b) => a.deltaE - b.deltaE)

  return results.slice(0, topN)
}
