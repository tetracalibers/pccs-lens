// ===== SVG dimensions =====
export const VIEW_SIZE = 400

// ===== Geometry =====
export const CX = VIEW_SIZE / 2
export const CY = VIEW_SIZE / 2
export const R = 150

// ===== Tick parameters =====
/** 円周をまたぐ目盛りの片側半分の長さ */
export const TICK_HALF = 10
export const STROKE_WIDTH = 2

// ===== Colors =====
export const COL_LINE = "var(--color-body)"
export const COL_TEXT = "var(--color-body)"

// ===== Number labels =====
export const NUM_FONT_SIZE = 22
/** 数字ラベルを配置する半径 (円の外側) */
export const NUM_RADIUS = R + 22

// ===== Letter labels (R, Y, G, B, O, P, V, YR, pR, ...) =====
export const LETTER_FONT_SIZE = 18
/** 円で囲むときの円の半径 */
export const LETTER_CIRCLE_R = 14
/** アルファベットラベルを配置する半径 (円の内側) */
export const LETTER_RADIUS = R - 28

// ===== Arc =====
/** 円弧 (○系のグルーピング) を描く半径. 主目盛りの外端と一致させる. */
export const ARC_RADIUS = R + TICK_HALF

/**
 * 角度から目盛り (円周をまたぐ短い線分) の両端座標を返す.
 * angleDeg: SVG y-down 座標. 0=東(3時), 90=南(6時), 180=西(9時), 270=北(12時).
 */
export function tickEndpoints(angleDeg: number): {
  x1: number
  y1: number
  x2: number
  y2: number
} {
  const r = (angleDeg * Math.PI) / 180
  const dx = Math.cos(r)
  const dy = Math.sin(r)
  return {
    x1: CX + (R - TICK_HALF) * dx,
    y1: CY + (R - TICK_HALF) * dy,
    x2: CX + (R + TICK_HALF) * dx,
    y2: CY + (R + TICK_HALF) * dy
  }
}

/** 角度から数字ラベルの中心座標を返す. */
export function numberPosition(angleDeg: number): { x: number; y: number } {
  const r = (angleDeg * Math.PI) / 180
  return {
    x: CX + NUM_RADIUS * Math.cos(r),
    y: CY + NUM_RADIUS * Math.sin(r)
  }
}

/** PCCS 番号 (1-24) → SVG 角度 (度). 番号 2 を 9時 (180°) として 15° 刻みで時計回り. */
export function hueAngle(hue: number): number {
  return (180 + (hue - 2) * 15 + 360 * 10) % 360
}

/** PCCS 番号からアルファベットラベルの中心座標を返す (円の内側). */
export function letterPosition(hue: number): { x: number; y: number } {
  const r = (hueAngle(hue) * Math.PI) / 180
  return {
    x: CX + LETTER_RADIUS * Math.cos(r),
    y: CY + LETTER_RADIUS * Math.sin(r)
  }
}

/**
 * 主円の外周に沿った円弧パスの d 属性を返す.
 * fromHue → toHue を時計回り (角度増加方向) に描画.
 */
export function arcPath(fromHue: number, toHue: number): string {
  const fromAng = hueAngle(fromHue)
  let toAng = hueAngle(toHue)
  if (toAng <= fromAng) toAng += 360
  const sRad = (fromAng * Math.PI) / 180
  const eRad = (toAng * Math.PI) / 180
  const x1 = CX + ARC_RADIUS * Math.cos(sRad)
  const y1 = CY + ARC_RADIUS * Math.sin(sRad)
  const x2 = CX + ARC_RADIUS * Math.cos(eRad)
  const y2 = CY + ARC_RADIUS * Math.sin(eRad)
  const largeArc = toAng - fromAng > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`
}
