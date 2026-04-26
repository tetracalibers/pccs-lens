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
