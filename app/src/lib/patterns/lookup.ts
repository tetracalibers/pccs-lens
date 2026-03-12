import type { PCCSColor } from "$lib/data/types"
import type { SelectedColor, SuggestOutput } from "./types"
import pccsColorsFull from "$lib/data/pccs_colors_full.json"

const COLORS = pccsColorsFull as PCCSColor[]

const ACHROMATIC_TONES = new Set(["W", "ltGy", "mGy", "dkGy", "Bk"])

/**
 * hueNumber と toneSymbol から PCCSColor を取得する。
 * - hueNumber === null または toneSymbol が無彩色バケット名の場合は無彩色として検索
 */
export function lookupPCCSColor(
  hueNumber: number | null,
  toneSymbol: string
): PCCSColor | undefined {
  if (hueNumber === null || ACHROMATIC_TONES.has(toneSymbol)) {
    return COLORS.find((c) => c.isNeutral && c.achromaticBucket === toneSymbol)
  }
  return COLORS.find(
    (c) => !c.isNeutral && c.hueNumber === hueNumber && c.toneSymbol === toneSymbol
  )
}

/**
 * サジェスト結果からランダムに SelectedColor を1件選ぶ。
 * PCCSColorとして実在する組み合わせのみを候補にする。
 */
export function pickRandomSuggest(suggest: SuggestOutput): SelectedColor | null {
  const candidates: SelectedColor[] = []

  for (const tone of suggest.suggestedTones) {
    if (ACHROMATIC_TONES.has(tone)) {
      if (lookupPCCSColor(null, tone)) {
        candidates.push({ hueNumber: null, toneSymbol: tone })
      }
    } else {
      for (const hue of suggest.suggestedHues) {
        if (lookupPCCSColor(hue, tone)) {
          candidates.push({ hueNumber: hue, toneSymbol: tone })
        }
      }
    }
  }

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
