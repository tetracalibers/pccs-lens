import chroma from "chroma-js"

/**
 * 明度対比（同時対比）で、地に囲まれた図の「見かけの明度」を見積もるための計算群。
 *
 * モデル: 見かけL* = 図L* − k・(地L* − 図L*)
 *   - L* は CIELAB の明度（0–100）。知覚的にほぼ等歩度。
 *   - k は同時対比の効き具合を表す係数（0 で対比なし）。
 *
 * 注意（保証ではなく目安）: 方向（明るい図を明るい地／暗い図を暗い地に置けば
 * 見かけが歩み寄る）は確定できるが、完全な等価は保証できない。効きは図の面積・形、
 * 表示環境、観察者差に依存する。最終確認は目視で行うこと。
 */

/** 図と、それを囲む地の組 */
export interface FigureOnGround {
  /** 図の色（hex） */
  figure: string
  /** 地の色（hex） */
  ground: string
}

/** 現実的な同時対比の効きの上限。必要な係数がこの範囲に収まれば「そろう見込み」とみなす。 */
export const REALISTIC_MAX_K = 0.2

/** CIELAB の明度 L*（0–100） */
export function lightness(hex: string): number {
  return chroma(hex).lab()[0]
}

/** 地に囲まれた図の見かけの明度 L* を、対比係数 k で見積もる */
export function apparentLightness(figureHex: string, groundHex: string, k: number): number {
  const figureL = lightness(figureHex)
  const groundL = lightness(groundHex)
  return figureL - k * (groundL - figureL)
}

/**
 * 2つの図の見かけの明度が一致する対比係数 k を逆算する。
 *   a.figureL − k(a.groundL − a.figureL) = b.figureL − k(b.groundL − b.figureL)
 *
 * 戻り値:
 *   - 正の有限値: その強さの対比でそろう
 *   - 0: 図の実際の明度がすでに等しい（対比なしでのみ一致 = 対比下では逆にずれる）
 *   - 負: 地の明暗が逆で、対比は図を遠ざける方向（そろわない）
 *   - 非有限（Infinity/NaN）: 左右の地が同じで対比差が生じない
 */
export function equalizingContrastK(a: FigureOnGround, b: FigureOnGround): number {
  const aFigureL = lightness(a.figure)
  const bFigureL = lightness(b.figure)
  const denominator = lightness(a.ground) - aFigureL - (lightness(b.ground) - bFigureL)
  return (aFigureL - bFigureL) / denominator
}

/**
 * 2つの図が「現実的な対比の範囲で同じ明るさに見え得る」かを判定する。
 * 見た目を揃えるのに必要な係数 k が (0, maxK] に収まるとき true。
 */
export function canAppearEqual(
  a: FigureOnGround,
  b: FigureOnGround,
  maxK: number = REALISTIC_MAX_K
): boolean {
  const k = equalizingContrastK(a, b)
  return Number.isFinite(k) && k > 0 && k <= maxK
}
