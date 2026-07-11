import type { JISColor } from "$lib/data/jis-colors"
import { JIS_COLORS } from "$lib/data/jis-colors"
import { parseMunsell, munsellHueRank } from "$lib/color/munsell"

/**
 * 明度マッチングゲームのラウンド生成ロジック。
 *
 * 「明度（マンセル Value）が基準色と完全一致する候補を、色相・彩度の手がかりに
 * 惑わされず選ぶ」というルールに沿って、基準色 1 枚＋候補 8 枚を生成する。
 */

/**
 * 出題モード。はずれ札で基準色に「近づける」属性を表す。
 * - "hue":    色相が近い色でそろえる（色相が手がかりにならない）
 * - "chroma": 彩度が近い色でそろえる（彩度が手がかりにならない）
 * どちらも、その属性が手がかりにならないため明度で見分けるしかなくなる。
 */
export type Mode = "hue" | "chroma"

/** 候補カードの枚数（固定）。 */
export const CANDIDATE_COUNT = 8
/** 1 ラウンドの正解枚数の下限・上限。 */
export const MIN_CORRECT = 1
export const MAX_CORRECT = 3
/** はずれ札の Value を基準色から散らす範囲（±0.5〜±1.0）。Value は 0.5 刻み。 */
const MISS_VALUE_DELTAS = [0.5, 1.0]
/** 「惜しい！」と表示する明度差のしきい値（この値以内の不正解のみ）。 */
export const NEAR_MISS_THRESHOLD = 0.5

export type CandidateColor = {
  color: JISColor
  /** マンセル Value。 */
  value: number
  /** 基準色と Value が完全一致するか。 */
  isCorrect: boolean
}

export type Round = {
  mode: Mode
  base: JISColor
  /** 基準色のマンセル Value。 */
  baseValue: number
  /** このラウンドの正解枚数（1〜3、在庫でクランプ済み）。 */
  correctCount: number
  /** 候補 8 枚（正解・はずれを混ぜてシャッフル済み）。 */
  candidates: CandidateColor[]
}

type Rng = () => number

/** マンセル Value・色相ランク・彩度を事前計算した色。 */
type EnrichedColor = {
  color: JISColor
  value: number
  /** 色相ランク [0, 100)。無彩色は null。 */
  hueRank: number | null
  /** マンセル Chroma。無彩色は 0。 */
  chroma: number
}

const enrich = (color: JISColor): EnrichedColor | null => {
  const munsell = parseMunsell(color.munsell)
  if (!munsell) return null
  if (munsell.isNeutral) {
    return { color, value: munsell.value, hueRank: null, chroma: 0 }
  }
  return {
    color,
    value: munsell.value,
    hueRank: munsellHueRank(munsell.hue),
    chroma: munsell.chroma
  }
}

/** 全 JIS 慣用色を Value・色相ランク・彩度付きで保持（パース不能は除外）。 */
const ENRICHED: EnrichedColor[] = JIS_COLORS.map(enrich).filter(
  (e): e is EnrichedColor => e !== null
)

/** Value ごとの色一覧。基準色プールの在庫判定と正解札抽出に使う。 */
const BY_VALUE: Map<number, EnrichedColor[]> = (() => {
  const map = new Map<number, EnrichedColor[]>()
  for (const e of ENRICHED) {
    const list = map.get(e.value) ?? []
    list.push(e)
    map.set(e.value, list)
  }
  return map
})()

const sameValueInventory = (value: number): number => BY_VALUE.get(value)?.length ?? 0

/**
 * 基準色プール。同 Value の相手が自分以外に 1 色以上ある有彩色のみ（＝正解札を最低 1 枚作れる）。
 * V=1.0 / 1.5 / 2.0 のように同 Value が 1 色しかない色は除外される。
 * 無彩色は色相が定義できず「色相が近い」を作れないため、基準色からは除外する。
 */
const BASE_POOL: EnrichedColor[] = ENRICHED.filter(
  (e) => e.hueRank !== null && sameValueInventory(e.value) >= 2
)

const approxEq = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9

const isMissValueDelta = (diff: number): boolean => MISS_VALUE_DELTAS.some((d) => approxEq(diff, d))

/** 色相ランクの循環距離（0〜50）。 */
const hueRankDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 100
  return Math.min(d, 100 - d)
}

const pickOne = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]

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
 * はずれ札を選ぶ。指定モードの属性（色相 or 彩度）が基準色に近い色を、近い順の近傍から抽出する。
 * 近い属性は手がかりにならないため、プレイヤーは明度で見分けるしかなくなる。
 * 在庫が薄ければ自然に条件がゆるむ（近傍が広がる）。
 */
const pickMissColors = (
  pool: readonly EnrichedColor[],
  count: number,
  mode: Mode,
  base: EnrichedColor,
  rng: Rng
): EnrichedColor[] => {
  if (pool.length <= count) return shuffle(pool, rng)
  const distance = (e: EnrichedColor): number => {
    if (mode === "hue") {
      return e.hueRank === null || base.hueRank === null
        ? Infinity
        : hueRankDistance(e.hueRank, base.hueRank)
    }
    return Math.abs(e.chroma - base.chroma)
  }
  const byNear = [...pool].sort((a, b) => distance(a) - distance(b))
  // 近い側の近傍（必要枚数の 2 倍）からランダムに選び、近さを保ちつつ変化を出す。
  const neighborhood = byNear.slice(0, Math.min(byNear.length, count * 2))
  return sample(neighborhood, count, rng)
}

/**
 * 1 ラウンド分の基準色＋候補 8 枚を生成する。
 *
 * @param mode 出題モード（色相が近い / 彩度が近い）
 * @param rng テスト用に差し替え可能な乱数源（既定は Math.random）
 */
export const generateRound = (mode: Mode, rng: Rng = Math.random): Round => {
  const base = pickOne(BASE_POOL, rng)
  const baseValue = base.value

  // 正解札: 基準色と同 Value（基準色自身を除く）。色相・彩度の制約なし。
  const correctPool = (BY_VALUE.get(baseValue) ?? []).filter((e) => e.color.id !== base.color.id)
  const correctCount = Math.min(randInt(MIN_CORRECT, MAX_CORRECT, rng), correctPool.length)
  const correct = sample(correctPool, correctCount, rng)

  const missCount = CANDIDATE_COUNT - correctCount
  const excludedIds = new Set<string>([base.color.id, ...correct.map((c) => c.color.id)])

  // はずれ札プール: Value 差が ±0.5〜±1.0（同 Value は混ぜない＝意図しない正解を防ぐ）。
  let missPool = ENRICHED.filter(
    (e) => !excludedIds.has(e.color.id) && isMissValueDelta(Math.abs(e.value - baseValue))
  )
  // 在庫が枚数に満たない場合のフォールバック（Value 条件を緩め、同 Value のみ避ける）。
  if (missPool.length < missCount) {
    missPool = ENRICHED.filter((e) => !excludedIds.has(e.color.id) && !approxEq(e.value, baseValue))
  }
  const miss = pickMissColors(missPool, missCount, mode, base, rng)

  const candidates: CandidateColor[] = shuffle(
    [
      ...correct.map((e) => ({ color: e.color, value: e.value, isCorrect: true })),
      ...miss.map((e) => ({ color: e.color, value: e.value, isCorrect: false }))
    ],
    rng
  )

  return { mode, base: base.color, baseValue, correctCount, candidates }
}

/** 不正解カードのうち「惜しい！」に該当するか（明度差が 0 より大きく NEAR_MISS_THRESHOLD 以内）。 */
export const isNearMiss = (baseValue: number, cardValue: number): boolean => {
  const diff = Math.abs(baseValue - cardValue)
  return diff > 0 && diff <= NEAR_MISS_THRESHOLD + 1e-9
}
