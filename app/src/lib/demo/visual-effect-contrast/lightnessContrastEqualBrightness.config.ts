import { PCCS_HEX_MAP } from "$lib/data/pccs"

/**
 * 「明度対比で明度の異なる色を同じ明るさに見せる」図解（LightnessContrastEqualBrightness）の配色。
 *
 * 図解コンポーネントと、同明度に見えるかを検証するテスト
 * （LightnessContrastEqualBrightness.spec.ts）の両方がここを参照する。
 * 配色を変えるときはこのファイルを編集する。
 */

const hex = (notation: string): string => PCCS_HEX_MAP.get(notation)!

/**
 * 図（星アイコン）の色。左が明るく、右が暗い。PCCS無彩色の表記。
 * 基準行で差がわかるよう2色を離しつつ、左の地（白に近いグレイ）で明るい図が沈むぶんを
 * 左を明るくして補う（check:contrast / spec で 必要k≈0.45 = かなり強い対比を要する領域）。
 */
export const FIGURE_NOTATIONS = ["Gy-7.5", "Gy-4.5"]

/** 図の hex（左・右） */
export const FIGURE_HEXES: string[] = FIGURE_NOTATIONS.map(hex)

/**
 * 各行の地 [左, 右]。
 *   0: 基準（白い地）              → 図の実際の明度差がわかる
 *   1: 対比（白に近いグレイの地＋黒い地）→ 明度対比で図が同じ明るさに見える
 * 左は白に近いグレイ、右は黒。左右の地の明暗差で図の見た目を中間へ寄せる。
 */
export const ROW_GROUNDS: [string, string][] = [
  ["#ffffff", "#ffffff"],
  [hex("Gy-8.5"), hex("Gy-3.0")]
]

/** 「同じ明るさに見せる」対比行の index */
export const CONTRAST_ROW_INDEX = 1

/** 対比行の「図と地」の組（左・右）。同明度に見えるかの検証に使う。 */
export const CONTRAST_PAIRS = FIGURE_HEXES.map((figure, i) => ({
  figure,
  ground: ROW_GROUNDS[CONTRAST_ROW_INDEX][i]
}))
