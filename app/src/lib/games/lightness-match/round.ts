import type { JISColor } from "$lib/data/jis-colors"
import { JIS_COLORS } from "$lib/data/jis-colors"
import { parseMunsell, munsellHueRank } from "$lib/color/munsell"

/**
 * 明度マッチングゲームのラウンド生成ロジック。
 *
 * 「明度（マンセル Value）が基準色と完全一致する候補を、色相・彩度の手がかりに
 * 惑わされず選ぶ」というルールに沿って、基準色 1 枚＋候補 8 枚を生成する。
 */

export type Difficulty = "beginner" | "advanced"

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
  difficulty: Difficulty
  base: JISColor
  /** 基準色のマンセル Value。 */
  baseValue: number
  /** このラウンドの正解枚数（1〜3、在庫でクランプ済み）。 */
  correctCount: number
  /** 候補 8 枚（正解・はずれを混ぜてシャッフル済み）。 */
  candidates: CandidateColor[]
}

type Rng = () => number

/** マンセル Value と色相ランクを事前計算した色。 */
type EnrichedColor = {
  color: JISColor
  value: number
  /** 色相ランク [0, 100)。無彩色は null。 */
  hueRank: number | null
}

const enrich = (color: JISColor): EnrichedColor | null => {
  const munsell = parseMunsell(color.munsell)
  if (!munsell) return null
  if (munsell.isNeutral) {
    return { color, value: munsell.value, hueRank: null }
  }
  const hueRank = munsellHueRank(munsell.hue)
  return { color, value: munsell.value, hueRank }
}

/** 全 JIS 慣用色を Value・色相ランク付きで保持（パース不能は除外）。 */
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
 * 基準色プール。同 Value の相手が自分以外に 1 色以上ある色のみ（＝正解札を最低 1 枚作れる）。
 * V=1.0 / 1.5 / 2.0 のように同 Value が 1 色しかない色は除外される。
 * 上級は全色相＋無彩色、初級は無彩色を除外（近色相ルールが定義できないため）。
 */
const ALL_BASE_POOL: EnrichedColor[] = ENRICHED.filter((e) => sameValueInventory(e.value) >= 2)
const CHROMATIC_BASE_POOL: EnrichedColor[] = ALL_BASE_POOL.filter((e) => e.hueRank !== null)

const approxEq = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9

const isMissValueDelta = (diff: number): boolean =>
  MISS_VALUE_DELTAS.some((d) => approxEq(diff, d))

/** 色相ランクの循環距離（0〜50）。 */
const hueRankDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 100
  return Math.min(d, 100 - d)
}

/** 色相の散らばり用の距離。無彩色は色相を持たないため特別扱いする。 */
const spreadDistance = (a: EnrichedColor, b: EnrichedColor): number => {
  if (a.hueRank === null && b.hueRank === null) return 0
  if (a.hueRank === null || b.hueRank === null) return 50
  return hueRankDistance(a.hueRank, b.hueRank)
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
 * 色相ができるだけばらけるよう、最遠点サンプリングで n 色選ぶ（上級用）。
 * ランダムな種から始め、既選択集合から最も遠い色を順に足していく。
 */
const pickSpread = (pool: readonly EnrichedColor[], n: number, rng: Rng): EnrichedColor[] => {
  if (pool.length <= n) return shuffle(pool, rng)
  const remaining = [...pool]
  const seedIndex = Math.floor(rng() * remaining.length)
  const chosen: EnrichedColor[] = [remaining.splice(seedIndex, 1)[0]]
  while (chosen.length < n) {
    let bestIndex = 0
    let bestDistance = -1
    for (let i = 0; i < remaining.length; i++) {
      let minToChosen = Infinity
      for (const c of chosen) {
        minToChosen = Math.min(minToChosen, spreadDistance(remaining[i], c))
      }
      if (minToChosen > bestDistance) {
        bestDistance = minToChosen
        bestIndex = i
      }
    }
    chosen.push(remaining.splice(bestIndex, 1)[0])
  }
  return chosen
}

/**
 * はずれ札を選ぶ。
 * - 初級: 基準色と色相が近い順の近傍から抽出（近傍内はランダム）。在庫が薄ければ自然に色相条件が緩む。
 * - 上級: 色相・彩度をわざとばらけさせる（最遠点サンプリング）。
 */
const pickMissColors = (
  pool: readonly EnrichedColor[],
  count: number,
  difficulty: Difficulty,
  base: EnrichedColor,
  rng: Rng
): EnrichedColor[] => {
  if (pool.length <= count) return shuffle(pool, rng)
  if (difficulty === "beginner" && base.hueRank !== null) {
    const baseHue = base.hueRank
    const byNearHue = [...pool].sort((a, b) => {
      const da = a.hueRank === null ? Infinity : hueRankDistance(a.hueRank, baseHue)
      const db = b.hueRank === null ? Infinity : hueRankDistance(b.hueRank, baseHue)
      return da - db
    })
    // 近い側の近傍（必要枚数の 2 倍）からランダムに選び、近色相を保ちつつ変化を出す。
    const neighborhood = byNearHue.slice(0, Math.min(byNearHue.length, count * 2))
    return sample(neighborhood, count, rng)
  }
  return pickSpread(pool, count, rng)
}

/**
 * 1 ラウンド分の基準色＋候補 8 枚を生成する。
 *
 * @param difficulty 難易度（初級 / 上級）
 * @param rng テスト用に差し替え可能な乱数源（既定は Math.random）
 */
export const generateRound = (difficulty: Difficulty, rng: Rng = Math.random): Round => {
  const basePool = difficulty === "beginner" ? CHROMATIC_BASE_POOL : ALL_BASE_POOL
  const base = pickOne(basePool, rng)
  const baseValue = base.value

  // 正解札: 基準色と同 Value（基準色自身を除く）。色相制約なし。
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
    missPool = ENRICHED.filter(
      (e) => !excludedIds.has(e.color.id) && !approxEq(e.value, baseValue)
    )
  }
  const miss = pickMissColors(missPool, missCount, difficulty, base, rng)

  const candidates: CandidateColor[] = shuffle(
    [
      ...correct.map((e) => ({ color: e.color, value: e.value, isCorrect: true })),
      ...miss.map((e) => ({ color: e.color, value: e.value, isCorrect: false }))
    ],
    rng
  )

  return { difficulty, base: base.color, baseValue, correctCount, candidates }
}

/** 不正解カードのうち「惜しい！」に該当するか（明度差が 0 より大きく NEAR_MISS_THRESHOLD 以内）。 */
export const isNearMiss = (baseValue: number, cardValue: number): boolean => {
  const diff = Math.abs(baseValue - cardValue)
  return diff > 0 && diff <= NEAR_MISS_THRESHOLD + 1e-9
}
