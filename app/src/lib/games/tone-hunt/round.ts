import { PCCS_CARD_199 } from "$lib/data/pccs"
import type { PCCSColor } from "$lib/data/types"

/**
 * トーン分類ゲーム（tone-hunt）のラウンド生成ロジック。
 *
 * 基準色に合わせるのではなく、「色単体を見て PCCS のトーン群（明清色 / 暗清色 /
 * 中間色）のどれに属すか」を見抜く分類ゲーム。選択中モードの正解トーン集合に
 * 属する候補を、非ターゲット色（純色 v を含む）に紛れた中から選ばせる。
 */

/**
 * 出題モード。探すトーン群を切り替える。
 * - "tint":  明清色を探す（純色＋白＝b / lt / p）
 * - "shade": 暗清色を探す（純色＋黒＝dk / dkg / dp）
 * - "mid":   中間色を探す（純色＋灰＝sf / d / ltg / g。s はプールに含めない）
 */
export type Mode = "tint" | "shade" | "mid"

/** トーンの清濁分類。表示ラベルと裏面の分類表示に使う。 */
export type ToneClass = "tint" | "shade" | "mid" | "vivid"

/** 候補カードの枚数（固定）。 */
export const CANDIDATE_COUNT = 8
/** 1 ラウンドの正解枚数の下限・上限。 */
export const MIN_CORRECT = 1
export const MAX_CORRECT = 3

/**
 * モードごとの正解トーン集合（確定仕様）。
 * 中間色モードの s は候補プールに存在しないため対象外（分類上は中間色）。
 */
export const TARGET_TONES: Record<Mode, readonly string[]> = {
  tint: ["b", "lt", "p"],
  shade: ["dk", "dkg", "dp"],
  mid: ["sf", "d", "ltg", "g"]
}

/** トーン記号 → 清濁分類。純色 v はどのモードでも常にはずれ札。 */
const CLASS_BY_TONE: Record<string, ToneClass> = {
  b: "tint",
  lt: "tint",
  p: "tint",
  dk: "shade",
  dkg: "shade",
  dp: "shade",
  sf: "mid",
  d: "mid",
  ltg: "mid",
  g: "mid",
  s: "mid",
  v: "vivid"
}

/** トーン記号から清濁分類を引く（未知・無彩色は null）。 */
export const toneClass = (toneSymbol: string | null): ToneClass | null =>
  toneSymbol ? (CLASS_BY_TONE[toneSymbol] ?? null) : null

/** 清濁分類の日本語ラベル。 */
export const TONE_CLASS_LABEL: Record<ToneClass, string> = {
  tint: "明清色",
  shade: "暗清色",
  mid: "中間色",
  vivid: "純色"
}

export type CandidateColor = {
  color: PCCSColor
  /** 選択中モードの正解トーン集合に属するか。 */
  isCorrect: boolean
}

export type Round = {
  mode: Mode
  /** このラウンドの正解枚数（1〜3）。 */
  correctCount: number
  /** 候補 8 枚（正解・はずれを混ぜてシャッフル済み）。 */
  candidates: CandidateColor[]
}

type Rng = () => number

/**
 * 候補プール = v トーン全 24 色相 ＋ s 以外の偶数色相 120 色 ＝ 144 色。
 * PCCS_CARD_199 から無彩色 17 色を除いたもの。無彩色・s トーンは含まれない。
 */
const POOL: PCCSColor[] = PCCS_CARD_199.filter((c) => !c.isNeutral)

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

const isTargetTone = (color: PCCSColor, targets: readonly string[]): boolean =>
  color.toneSymbol !== null && targets.includes(color.toneSymbol)

/**
 * 1 ラウンド分の候補 8 枚を生成する。
 *
 * 正解札 = 選択中モードの正解トーン集合から 1〜3 枚。
 * はずれ札 = 非ターゲット色（v を含む）から純粋ランダム。トーン近接による重み付けはしない。
 * 正解トーンの混入・無彩色・s・同一色の重複は起こらない（プール分割＋重複なしサンプリング）。
 *
 * @param mode 出題モード（明清色 / 暗清色 / 中間色 を探す）
 * @param rng テスト用に差し替え可能な乱数源（既定は Math.random）
 */
export const generateRound = (mode: Mode, rng: Rng = Math.random): Round => {
  const targets = TARGET_TONES[mode]
  const correctPool = POOL.filter((c) => isTargetTone(c, targets))
  const missPool = POOL.filter((c) => !isTargetTone(c, targets))

  // 在庫（明清 36 / 暗清 36 / 中間 48）は常に十分だが、念のため在庫でクランプする。
  const correctCount = Math.min(randInt(MIN_CORRECT, MAX_CORRECT, rng), correctPool.length)
  const correct = sample(correctPool, correctCount, rng)
  const miss = sample(missPool, CANDIDATE_COUNT - correctCount, rng)

  const candidates: CandidateColor[] = shuffle(
    [
      ...correct.map((color) => ({ color, isCorrect: true })),
      ...miss.map((color) => ({ color, isCorrect: false }))
    ],
    rng
  )

  return { mode, correctCount, candidates }
}
