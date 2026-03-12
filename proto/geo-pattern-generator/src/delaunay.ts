/**
 * Bowyer-Watson アルゴリズムによるドロネー三角形分割と点生成ユーティリティ。
 * geometric-shade.ts / geometric-blend-dense.ts から共有して使用する。
 */

export interface Point {
  x: number
  y: number
}

export interface Tri {
  a: Point
  b: Point
  c: Point
}

// ================================================================
// Bowyer-Watson ドロネー三角形分割
// ================================================================

function circumcircle(t: Tri): { cx: number; cy: number; r2: number } {
  const { a, b, c } = t
  const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(D) < 1e-10) return { cx: 0, cy: 0, r2: Infinity }
  const q = (p: Point) => p.x * p.x + p.y * p.y
  const cx = (q(a) * (b.y - c.y) + q(b) * (c.y - a.y) + q(c) * (a.y - b.y)) / D
  const cy = (q(a) * (c.x - b.x) + q(b) * (a.x - c.x) + q(c) * (b.x - a.x)) / D
  return { cx, cy, r2: (a.x - cx) ** 2 + (a.y - cy) ** 2 }
}

function eqPt(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01
}

function eqEdge(e1: [Point, Point], e2: [Point, Point]): boolean {
  return (
    (eqPt(e1[0], e2[0]) && eqPt(e1[1], e2[1])) ||
    (eqPt(e1[0], e2[1]) && eqPt(e1[1], e2[0]))
  )
}

export function triangulate(points: Point[]): Tri[] {
  const M = 4000
  const st: Tri = { a: { x: -M, y: -M }, b: { x: 0, y: M * 2 }, c: { x: M * 2, y: -M } }
  let tris: Tri[] = [st]

  for (const p of points) {
    const bad = tris.filter(t => {
      const { cx, cy, r2 } = circumcircle(t)
      return (p.x - cx) ** 2 + (p.y - cy) ** 2 < r2 - 1e-10
    })

    const allEdges = bad.flatMap(t => [[t.a, t.b], [t.b, t.c], [t.c, t.a]] as [Point, Point][])
    const boundary = allEdges.filter(e => allEdges.filter(f => eqEdge(e, f)).length === 1)

    tris = tris.filter(t => !bad.includes(t))
    tris.push(...boundary.map(([e0, e1]) => ({ a: e0, b: e1, c: p })))
  }

  const sv = [st.a, st.b, st.c]
  return tris.filter(t => ![t.a, t.b, t.c].some(v => sv.some(s => eqPt(v, s))))
}

// ================================================================
// 点の生成（境界点 + ジッターグリッド内部点）
// ================================================================

/**
 * @param interiorCount - 内部点の目標数（三角形数 ≈ interiorCount × 2）
 * @param size          - キャンバスのサイズ（px）
 * @param edgeDivs      - 各辺の分割数（境界三角形の歪み防止）
 */
export function generatePoints(interiorCount: number, size: number, edgeDivs = 5): Point[] {
  const pts: Point[] = []

  for (let i = 0; i <= edgeDivs; i++) {
    const t = (i / edgeDivs) * size
    pts.push({ x: t, y: 0 }, { x: t, y: size }, { x: 0, y: t }, { x: size, y: t })
  }

  const cols = Math.round(Math.sqrt(interiorCount))
  const rows = Math.round(interiorCount / cols)
  const cw = size / (cols + 1)
  const rh = size / (rows + 1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 1) * cw + (Math.random() - 0.5) * cw * 0.9
      const y = (r + 1) * rh + (Math.random() - 0.5) * rh * 0.9
      pts.push({
        x: Math.max(1, Math.min(size - 1, x)),
        y: Math.max(1, Math.min(size - 1, y)),
      })
    }
  }

  return pts
}

// ================================================================
// SVG パス文字列
// ================================================================

export function triPath(t: Tri): string {
  return (
    `M ${t.a.x.toFixed(1)},${t.a.y.toFixed(1)}` +
    ` L ${t.b.x.toFixed(1)},${t.b.y.toFixed(1)}` +
    ` L ${t.c.x.toFixed(1)},${t.c.y.toFixed(1)} Z`
  )
}
