import { PCCS_HEX_MAP } from "$lib/data/pccs"
import { equalizingFigureHexes } from "$lib/color/lightnessContrast"

/**
 * 「明度対比で明度の異なる色を同じ明るさに見せる」図解（LightnessContrastEqualBrightness）の配色。
 *
 * 図解コンポーネントと、同明度に見えるかを検証するテスト
 * （LightnessContrastEqualBrightness.spec.ts）の両方がここを参照する。
 * 配色を変えるときはこのファイルを編集する。
 */

const hex = (notation: string): string => PCCS_HEX_MAP.get(notation)!

/**
 * 各行の地 [左, 右]。
 *   0: 基準（白い地）      → 図の実際の明度差がわかる
 *   1: 対比（白い地＋黒い地）→ 明度対比で図が同じ明るさに見える
 * 左は白、右は黒。左右の地の明暗差で図の見た目を中間へ寄せる。
 */
export const ROW_GROUNDS: [string, string][] = [
  ["#ffffff", "#ffffff"],
  [hex("Gy-8.5"), hex("Gy-3.5")]
]

/** 「同じ明るさに見せる」対比行の index */
export const CONTRAST_ROW_INDEX = 1

/**
 * 想定する明度対比の効き。★この値だけ変えれば図の色（FIGURE_HEXES）が自動で再計算される。
 * 大きいほど左右の実明度差が広がる（＝対比が強く効く環境向け）。
 * 実効kは環境依存なので、見た目を確認して調整する（左が暗い→上げる／右が暗い→下げる）。
 */
export const ASSUMED_CONTRAST_K = 1

/** 図2色の実明度の中心 L*（対比後に揃って見える明るさ） */
const FIGURE_CENTER_L = 62

/**
 * 図（花アイコン）の色 [左（明るい）, 右（暗い）]。
 * 対比行の地（白/黒）と ASSUMED_CONTRAST_K から、見かけの明度が左右で一致するよう自動計算する無彩色。
 * PCCSの段階に縛られず L* から逆算するので、k を変えるだけで最適なグレーが求まる。
 */
export const FIGURE_HEXES: string[] = equalizingFigureHexes(
  ROW_GROUNDS[CONTRAST_ROW_INDEX][0],
  ROW_GROUNDS[CONTRAST_ROW_INDEX][1],
  ASSUMED_CONTRAST_K,
  FIGURE_CENTER_L
)

/** 対比行の「図と地」の組（左・右）。同明度に見えるかの検証に使う。 */
export const CONTRAST_PAIRS = FIGURE_HEXES.map((figure, i) => ({
  figure,
  ground: ROW_GROUNDS[CONTRAST_ROW_INDEX][i]
}))
