/**
 * 分光分布（波長ごとの光の強さ）から色を求める計算。
 *
 * 干渉・回折のように「波長ごとに強め合う／打ち消し合う」ことで色が決まる現象では、
 * RGB を直接いじって色を作ることができない。可視域の分光分布をいったん組み立て、
 * それを人の眼の感度（等色関数）を通して XYZ に積分してから RGB へ変換する。
 */

/** 可視域として扱う範囲（nm） */
export const VISIBLE_MIN_NM = 380
export const VISIBLE_MAX_NM = 730

/** 積分の刻み幅（nm）。可視域を 5nm ごとに刻めば、単色に近い分布でも色がぶれない */
const SAMPLE_STEP_NM = 5

/** 線形 sRGB・XYZ いずれも「3 つの成分の組」として扱う */
export type Tristimulus = [number, number, number]

/**
 * 左右で幅の違うガウス関数。等色関数の各ローブはピークをはさんで裾の広がり方が違うため、
 * ピークより短波長側と長波長側で幅を切り替える
 */
const piecewiseGaussian = (nm: number, peak: number, widthLow: number, widthHigh: number) => {
  const width = nm < peak ? widthLow : widthHigh
  const t = (nm - peak) / width
  return Math.exp(-0.5 * t * t)
}

/**
 * CIE 1931 等色関数（2度視野）の多ローブ・ガウシアン近似。
 *
 * 出典: Wyman, Sloan, Shirley, "Simple Analytic Approximations to the CIE XYZ Color
 * Matching Functions", Journal of Computer Graphics Techniques Vol.2 No.2 (2013)。
 * 5nm 刻みの数表を持たずに、可視域全体で 1% 程度の誤差に収まる。
 */
const colorMatching = (nm: number): Tristimulus => [
  1.056 * piecewiseGaussian(nm, 599.8, 37.9, 31.0) +
    0.362 * piecewiseGaussian(nm, 442.0, 16.0, 26.7) -
    0.065 * piecewiseGaussian(nm, 501.1, 20.4, 26.2),
  0.821 * piecewiseGaussian(nm, 568.8, 46.9, 40.5) +
    0.286 * piecewiseGaussian(nm, 530.9, 16.3, 31.1),
  1.217 * piecewiseGaussian(nm, 437.0, 11.8, 36.0) +
    0.681 * piecewiseGaussian(nm, 459.0, 26.0, 13.8)
]

/** 積分に使う波長と、そこでの等色関数の値 */
const SAMPLES = Array.from(
  { length: Math.round((VISIBLE_MAX_NM - VISIBLE_MIN_NM) / SAMPLE_STEP_NM) + 1 },
  (_, i) => {
    const nm = VISIBLE_MIN_NM + i * SAMPLE_STEP_NM
    return { nm, matching: colorMatching(nm) }
  }
)

/** すべての波長が同じ強さ（＝ 1）のときの XYZ。これを「白」と見なすための基準にする */
const FLAT_XYZ: Tristimulus = SAMPLES.reduce<Tristimulus>(
  (sum, { matching }) => [sum[0] + matching[0], sum[1] + matching[1], sum[2] + matching[2]],
  [0, 0, 0]
)

/** sRGB が白とする光（D65）の XYZ */
const WHITE_XYZ: Tristimulus = [0.9505, 1, 1.089]

/**
 * 分光分布を XYZ へ積分する。
 *
 * `intensity` は波長（nm）を受け取り、その波長の光の強さ（`0`〜`1`）を返す関数。
 * すべての波長が `1` のときちょうど白（線形 sRGB がすべて `1`）になるよう、
 * 成分ごとに基準の白へ合わせてから返す。
 */
export const spectrumToXyz = (intensity: (nm: number) => number): Tristimulus => {
  const sum: Tristimulus = [0, 0, 0]
  for (const { nm, matching } of SAMPLES) {
    const value = intensity(nm)
    sum[0] += value * matching[0]
    sum[1] += value * matching[1]
    sum[2] += value * matching[2]
  }
  return [
    (sum[0] / FLAT_XYZ[0]) * WHITE_XYZ[0],
    (sum[1] / FLAT_XYZ[1]) * WHITE_XYZ[1],
    (sum[2] / FLAT_XYZ[2]) * WHITE_XYZ[2]
  ]
}

/** XYZ から線形 sRGB（ガンマを掛ける前の値）へ。sRGB の原色と D65 白色点による変換行列 */
export const xyzToLinearSrgb = ([x, y, z]: Tristimulus): Tristimulus => [
  3.2406 * x - 1.5372 * y - 0.4986 * z,
  -0.9689 * x + 1.8758 * y + 0.0415 * z,
  0.0557 * x - 0.204 * y + 1.057 * z
]

/**
 * sRGB の色域からはみ出した色（成分が負になった色）を、色域の内側へ引き戻す。
 * 全成分に同じ量の白を足すので、彩度は落ちるが色相はほぼ保たれる。
 */
export const desaturateToGamut = ([r, g, b]: Tristimulus): Tristimulus => {
  const lowest = Math.min(r, g, b)
  if (lowest >= 0) return [r, g, b]
  return [r - lowest, g - lowest, b - lowest]
}

/** 線形 sRGB の 1 成分を、画面へ出す sRGB の値（`0`〜`1`）へ変換する */
export const encodeSrgb = (value: number) => {
  const clamped = Math.min(Math.max(value, 0), 1)
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}
