import chroma from "chroma-js"

/**
 * 明度対比の図解（LightnessContrastEqualBrightness）で、
 * 同時対比後に左右の図が同じ明るさに見える無彩色を求めるための計算。
 *
 * モデル: 見かけL* = 図L* − k・(地L* − 図L*)
 *   L* は CIELAB の明度（0–100）。k は同時対比の効き（0 で対比なし）。
 */

/** CIELAB の明度 L*（0–100） */
export function lightness(hex: string): number {
  return chroma(hex).lab()[0]
}

/** CIELAB の明度 L*（0–100）から無彩色（グレー）の hex を得る */
export function grayHexForLightness(l: number): string {
  return chroma.lab(l, 0, 0).hex()
}

/**
 * 明度対比後に左右の図が同じ明るさに見える、無彩色の図の色（左・右）を求める。
 * 見かけが一致する実明度差 D = k・(地のL*差) / (1+k) を、中心 centerL を挟んで
 * 上下 D/2 ずつに割り振る。k を変えるだけで最適なグレーが求まる。
 *
 * @param groundLeft  左の地の hex（明るい地を想定）
 * @param groundRight 右の地の hex（暗い地を想定）
 * @param k           想定する同時対比の効き
 * @param centerL     図2色の実明度の中心 L*（対比後に揃って見える明るさ）
 * @returns [左図hex（明るい）, 右図hex（暗い）]
 */
export function equalizingFigureHexes(
  groundLeft: string,
  groundRight: string,
  k: number,
  centerL: number
): [string, string] {
  const spread = lightness(groundLeft) - lightness(groundRight)
  const d = (k * spread) / (1 + k)
  return [grayHexForLightness(centerL + d / 2), grayHexForLightness(centerL - d / 2)]
}
