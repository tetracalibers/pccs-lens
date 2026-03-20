import type { PCCSColor } from "$lib/data/types"
import type { SelectedColor, SuggestOutput } from "./types"
import pccsV24 from "$lib/data/pccs_v24.json"
import pccsS12 from "$lib/data/pccs_s12.json"
import pccsEven12 from "$lib/data/pccs_even12.json"
import pccsOdd12 from "$lib/data/pccs_odd12.json"
import pccsNeutral from "$lib/data/pccs_neutral.json"

const COLORS = [...pccsV24, ...pccsS12, ...pccsEven12, ...pccsOdd12, ...pccsNeutral] as PCCSColor[]

export const ACHROMATIC_TONES = new Set(["W", "ltGy", "mGy", "dkGy", "Bk"])

/** 'Gy-4.5' 形式の細かいグレイ記号かどうか */
function isSpecificGray(tone: string): boolean {
  return /^Gy-/.test(tone)
}

/** toneSymbol が無彩色（バケット名 or 細かいグレイ記号）かどうか */
export function isAchromaticTone(tone: string): boolean {
  return ACHROMATIC_TONES.has(tone) || isSpecificGray(tone)
}

/**
 * hueNumber と toneSymbol から PCCSColor を取得する。
 * - hueNumber === null または toneSymbol が無彩色の場合は無彩色として検索
 * - 'Gy-X.X' 形式の細かいグレイ記号は notation で直接ルックアップ
 */
export function lookupPCCSColor(
  hueNumber: number | null,
  toneSymbol: string
): PCCSColor | undefined {
  if (isSpecificGray(toneSymbol)) {
    return COLORS.find((c) => c.isNeutral && c.notation === toneSymbol)
  }
  if (hueNumber === null || ACHROMATIC_TONES.has(toneSymbol)) {
    return COLORS.find((c) => c.isNeutral && c.achromaticBucket === toneSymbol)
  }
  return COLORS.find(
    (c) => !c.isNeutral && c.hueNumber === hueNumber && c.toneSymbol === toneSymbol
  )
}

/**
 * 各グレイバケットに含まれる細かいグレイ色（Gy-X.X）のリスト（明るい順）
 */
export const GRAY_SUB_TONES: Record<string, PCCSColor[]> = (() => {
  const buckets: Record<string, PCCSColor[]> = { ltGy: [], mGy: [], dkGy: [] }
  for (const c of COLORS) {
    if (c.isNeutral && c.notation !== "W" && c.notation !== "Bk" && c.achromaticBucket) {
      if (c.achromaticBucket in buckets) {
        buckets[c.achromaticBucket].push(c)
      }
    }
  }
  // 明るい順（Gy番号降順）でソート
  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => {
      const na = parseFloat(a.notation.replace("Gy-", ""))
      const nb = parseFloat(b.notation.replace("Gy-", ""))
      return nb - na
    })
  }
  return buckets
})()

/**
 * サジェスト結果からランダムに SelectedColor を1件選ぶ。
 * PCCSColorとして実在する組み合わせのみを候補にする。
 */
export function pickRandomSuggest(suggest: SuggestOutput): SelectedColor | null {
  const candidates: SelectedColor[] = []

  for (const tone of suggest.suggestedTones) {
    if (isAchromaticTone(tone)) {
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
