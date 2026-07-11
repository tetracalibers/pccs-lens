import { PCCS_CARD_199 } from "$lib/data/pccs"
import { PCCS_CHROMATIC_TONE_SYMBOLS, PCCS_TONES, getAdjacentTones } from "$lib/data/pccs-tone"
import type { PCCSColor } from "$lib/data/types"

/**
 * トーン同定ゲーム（tone-match）のラウンド生成ロジック。
 *
 * トーンマップで選んだ 1 つのトーンをお題として提示し、そのトーンに属する色を
 * 候補カードの中から探させる。清濁 3 グループを見分ける tone-hunt より一段細かく、
 * 個々のトーンの弁別を鍛える。はずれ札はなるべく隣接トーンから選び、紛らわしい
 * トーン同士の識別を迫る。
 */

/** 候補カードの枚数（固定）。 */
export const CANDIDATE_COUNT = 8
/** 1 ラウンドの正解枚数の下限・上限。 */
export const MIN_CORRECT = 1
export const MAX_CORRECT = 3
/** 無彩色 distractor を 1 枚混ぜる確率（変化球。毎回は入れない）。 */
export const NEUTRAL_MIX_PROBABILITY = 0.4

/**
 * お題にできる有彩色 11 トーン（v / b / dp / lt / sf / d / dk / p / ltg / g / dkg）。
 * s トーンと奇数色相は新配色カード199 準拠プールに含まれないため対象外。
 */
export const TARGET_TONES: readonly string[] = PCCS_CHROMATIC_TONE_SYMBOLS.filter(
  (tone) => tone !== "s"
)

/**
 * 色相フィルタで選べる色相（全トーン共通の偶数 12 色相）。
 * 奇数色相は v 以外のトーンに色が無いため、どのお題でも成立する偶数のみを対象にする。
 */
export const SELECTABLE_HUES: readonly number[] = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

export type CandidateColor = {
  color: PCCSColor
  /** カードのトーンがお題トーンと一致するか。 */
  isCorrect: boolean
}

export type Round = {
  /** お題トーン（探す対象）。 */
  target: string
  /** 出題を絞り込む色相（null は全色相）。 */
  hue: number | null
  /** このラウンドの正解枚数（1〜3。色相フィルタ時は必然的に 1）。 */
  correctCount: number
  /** 候補 8 枚（正解・はずれを混ぜてシャッフル済み）。 */
  candidates: CandidateColor[]
}

type Rng = () => number

/**
 * 有彩色プール = v トーン全 24 色相 ＋ s 以外の偶数色相 120 色 ＝ 144 色。
 * PCCS_CARD_199 から無彩色 17 色を除いたもの。無彩色・s・奇数色相は含まれない。
 */
const CHROMATIC_POOL: PCCSColor[] = PCCS_CARD_199.filter((c) => !c.isNeutral)

/**
 * 無彩色 distractor プール = 代表 5 グレー（W / ltGy / mGy / dkGy / Bk）。
 * PCCS_CARD_199 の無彩色のうち toneSymbol を持つ 5 色。
 */
const NEUTRAL_POOL: PCCSColor[] = PCCS_CARD_199.filter((c) => c.isNeutral && c.toneSymbol !== null)

/** トーンの明度水準。無彩色 distractor をお題トーンの明度に近づけるのに使う。 */
type LightnessLevel = "high" | "medium" | "low"

/** トーン記号 → 明度水準（トーンデータの categories から判定）。 */
const toneLightnessLevel = (tone: string): LightnessLevel => {
  const categories = PCCS_TONES.find((t) => t.toneSymbol === tone)?.categories ?? []
  if (categories.includes("高明度")) return "high"
  if (categories.includes("低明度")) return "low"
  return "medium"
}

/** 明度水準 → 近い無彩色トーン記号（高明度＝白・明灰／中明度＝中灰／低明度＝暗灰・黒）。 */
const NEUTRAL_TONE_BY_LEVEL: Record<LightnessLevel, readonly string[]> = {
  high: ["W", "ltGy"],
  medium: ["mGy"],
  low: ["dkGy", "Bk"]
}

/** 無彩色トーンの和名（PCCS_TONES に定義の無い ltGy / mGy / dkGy を補う）。 */
const NEUTRAL_TONE_NAME_JA: Record<string, string> = {
  W: "ホワイト",
  ltGy: "ライトグレイ",
  mGy: "ミディアムグレイ",
  dkGy: "ダークグレイ",
  Bk: "ブラック"
}

/** トーン記号の和名を引く（有彩色はトーンデータ、無彩色は代表グレー名でフォールバック）。 */
export const toneNameJa = (tone: string | null): string => {
  if (!tone) return ""
  return (
    PCCS_TONES.find((t) => t.toneSymbol === tone)?.toneNameJa ?? NEUTRAL_TONE_NAME_JA[tone] ?? tone
  )
}

/**
 * お題トーンに隣接する有彩色トーン（縦・横・斜め）。プール外の s は除外する。
 * はずれ札を「なるべく隣接トーンから」選ぶために使う。
 */
export const adjacentChromaticTones = (target: string): string[] =>
  getAdjacentTones(target).filter((tone) => TARGET_TONES.includes(tone))

/**
 * 選んだ不正解が「惜しい！」に該当するか。
 * お題トーンの隣接トーン（縦・横・斜め）を選んだ不正解のみ true。
 * 無彩色カードのトーン記号は隣接集合に含まれないため常に false。
 */
export const isNearMissTone = (target: string, cardTone: string | null): boolean =>
  cardTone !== null && getAdjacentTones(target).includes(cardTone)

const shuffle = <T>(arr: readonly T[], rng: Rng): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const sample = <T>(arr: readonly T[], n: number, rng: Rng): T[] => shuffle(arr, rng).slice(0, n)

const randInt = (min: number, max: number, rng: Rng): number =>
  min + Math.floor(rng() * (max - min + 1))

/**
 * 1 ラウンド分の候補 8 枚を生成する。
 *
 * 正解札 = お題トーンから 1〜3 枚（色相フィルタ時はその色相の 1 枚のみ）。
 * はずれ札 = なるべく隣接トーンの有彩色から。不足分は非隣接の有彩色でフォールバック。
 *   色相フィルタが無いときは、確率で 1 枚だけお題トーンの明度水準に近い無彩色（変化球）を混ぜる。
 * 色相フィルタが有るときは全カードをその色相にそろえる（無彩色は色相を持たないため混ぜない）。
 * 正解トーンの混入・同一色の重複は起こらない（プール分割＋重複なしサンプリング）。
 *
 * @param target お題トーン（探す対象の有彩色トーン）
 * @param hue 出題を絞り込む色相（null は全色相）
 * @param rng テスト用に差し替え可能な乱数源（既定は Math.random）
 */
export const generateRound = (
  target: string,
  hue: number | null = null,
  rng: Rng = Math.random
): Round => {
  // 色相フィルタが有効なら、その色相の色だけを候補にする。
  const inHue = (c: PCCSColor): boolean => hue === null || c.hueNumber === hue

  // 正解札: お題トーンの色から 1〜3 枚（在庫でクランプ）。
  // 色相フィルタ時は該当色相の 1 色しかないため必然的に 1 枚になる。
  const correctPool = CHROMATIC_POOL.filter((c) => c.toneSymbol === target && inHue(c))
  const correctCount = Math.min(randInt(MIN_CORRECT, MAX_CORRECT, rng), correctPool.length)
  const correct = sample(correctPool, correctCount, rng)

  const missCount = CANDIDATE_COUNT - correctCount
  const usedNotations = new Set(correct.map((c) => c.notation))
  const miss: PCCSColor[] = []

  // 変化球: たまに無彩色を 1 枚。お題トーンの明度水準に近いグレーを選ぶ。
  // 色相フィルタ時は全カードを同一色相にそろえるため無彩色は入れない。
  let neutralSlots = 0
  if (hue === null && missCount > 0 && rng() < NEUTRAL_MIX_PROBABILITY) {
    const allowed = NEUTRAL_TONE_BY_LEVEL[toneLightnessLevel(target)]
    const neutralCandidates = NEUTRAL_POOL.filter((c) => allowed.includes(c.toneSymbol!))
    const [gray] = sample(neutralCandidates, 1, rng)
    if (gray) {
      miss.push(gray)
      usedNotations.add(gray.notation)
      neutralSlots = 1
    }
  }

  // 有彩色はずれ札: なるべく隣接トーンから。
  const chromaticMissCount = missCount - neutralSlots
  const adjacent = adjacentChromaticTones(target)
  const adjacentPool = CHROMATIC_POOL.filter(
    (c) =>
      c.toneSymbol !== target &&
      !usedNotations.has(c.notation) &&
      c.toneSymbol !== null &&
      adjacent.includes(c.toneSymbol) &&
      inHue(c)
  )
  const fromAdjacent = sample(adjacentPool, Math.min(chromaticMissCount, adjacentPool.length), rng)
  for (const c of fromAdjacent) usedNotations.add(c.notation)
  miss.push(...fromAdjacent)

  // 隣接だけで埋まらなければ、非隣接の有彩色トーンでフォールバック。
  const shortfall = chromaticMissCount - fromAdjacent.length
  if (shortfall > 0) {
    const fallbackPool = CHROMATIC_POOL.filter(
      (c) => c.toneSymbol !== target && !usedNotations.has(c.notation) && inHue(c)
    )
    const fallback = sample(fallbackPool, Math.min(shortfall, fallbackPool.length), rng)
    for (const c of fallback) usedNotations.add(c.notation)
    miss.push(...fallback)
  }

  const candidates: CandidateColor[] = shuffle(
    [
      ...correct.map((color) => ({ color, isCorrect: true })),
      ...miss.map((color) => ({ color, isCorrect: false }))
    ],
    rng
  )

  return { target, hue, correctCount, candidates }
}
