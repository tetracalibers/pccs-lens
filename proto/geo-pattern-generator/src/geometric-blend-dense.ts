/**
 * パターン: 幾何学的な色ブレンドによる高密度三角形パターン
 *
 * CSS の mix-blend-mode は使わず、三角形の交差領域を
 * Sutherland-Hodgman アルゴリズムで幾何学的に計算し、
 * その領域にブレンド済みの色を直接塗る。
 *
 * 描画順（後から塗るほど正しい色が上書きされる）:
 *   1. ベース三角形（不透明）
 *   2. 2 枚の三角形が重なる領域 → screen(c1, c2)
 *   3. 3 枚の三角形が重なる領域 → screen(c1, c2, c3)
 *
 * screen ブレンド: result = 1 - ∏(1 - ci)  （交換・結合則が成立）
 * → 重なるほど明るく彩度が上がる加算混色。
 */
import { createCanvas, writeGeneratedSVG, pick, shadeColor } from './utils.js'

const SIZE = 300
const MIN_AREA = 3 // これ以下の面積(px²)の交差は無視

// ================================================================
// 型
// ================================================================

interface Pt { x: number; y: number }
type Tri = [Pt, Pt, Pt]
interface TriData { tri: Tri; color: string }

// ================================================================
// 色演算
// ================================================================

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}

/**
 * screen ブレンド: result_ch = 1 - ∏(1 - c_i / 255)
 * 任意の個数の色を受け取り、result を返す。
 */
function screenBlend(...colors: string[]): string {
  let mr = 1, mg = 1, mb = 1
  for (const col of colors) {
    const [r, g, b] = hexToRgb(col)
    mr *= (1 - r / 255)
    mg *= (1 - g / 255)
    mb *= (1 - b / 255)
  }
  return rgbToHex((1 - mr) * 255, (1 - mg) * 255, (1 - mb) * 255)
}

// ================================================================
// ポリゴン交差（Sutherland-Hodgman）
// ================================================================

/** clip 辺 a→b に対して p が内側（左側）かどうか */
function inside(p: Pt, a: Pt, b: Pt): boolean {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= -1e-9
}

/** 直線 p→q と 直線 a→b の交点 */
function intersect(p: Pt, q: Pt, a: Pt, b: Pt): Pt {
  const A1 = q.y - p.y, B1 = p.x - q.x, C1 = A1 * p.x + B1 * p.y
  const A2 = b.y - a.y, B2 = a.x - b.x, C2 = A2 * a.x + B2 * a.y
  const det = A1 * B2 - A2 * B1
  if (Math.abs(det) < 1e-10) return p
  return { x: (C1 * B2 - C2 * B1) / det, y: (A1 * C2 - A2 * C1) / det }
}

/**
 * subject ポリゴンを clip ポリゴンでクリップして交差領域を返す。
 * clip は凸ポリゴンであること（三角形の場合は常に凸）。
 */
function clipPolygon(subject: Pt[], clip: Pt[]): Pt[] {
  let out = subject
  const n = clip.length
  for (let i = 0; i < n && out.length > 0; i++) {
    const a = clip[i], b = clip[(i + 1) % n]
    const inp = out
    out = []
    for (let j = 0; j < inp.length; j++) {
      const s = inp[j], e = inp[(j + 1) % inp.length]
      const sIn = inside(s, a, b), eIn = inside(e, a, b)
      if (eIn) {
        if (!sIn) out.push(intersect(s, e, a, b))
        out.push(e)
      } else if (sIn) {
        out.push(intersect(s, e, a, b))
      }
    }
  }
  return out
}

function polyArea(pts: Pt[]): number {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(a) / 2
}

function polyPath(pts: Pt[]): string {
  return (
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
  )
}

// ================================================================
// 三角形の生成（層化ランダム配置）
// ================================================================

/**
 * キャンバスをグリッドに分割し、各セルに三角形を 1 つ配置する。
 * 三角形のサイズをセルより大きくすることで隣接セルとの重なりを生む。
 */
function generateTriangles(colorPool: string[]): TriData[] {
  const COLS = 6, ROWS = 5
  const CW = SIZE / COLS, CH = SIZE / ROWS
  const result: TriData[] = []

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // セル内でランダムに重心を決定
      const cx = (c + 0.5) * CW + (Math.random() - 0.5) * CW * 0.5
      const cy = (r + 0.5) * CH + (Math.random() - 0.5) * CH * 0.5

      // セル幅の 80〜140% を外接円半径とする（隣接セルへのはみ出しで重なりが生まれる）
      const R = CW * (0.8 + Math.random() * 0.6)
      const baseAngle = Math.random() * Math.PI * 2

      // 120° 間隔 + ランダムなずれで頂点を生成（多様な形状を作る）
      const tri: Tri = [0, 1, 2].map(i => {
        const angle = baseAngle + i * ((2 * Math.PI) / 3) + (Math.random() - 0.5) * 0.9
        const r = R * (0.65 + Math.random() * 0.7)
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
      }) as Tri

      result.push({ tri, color: pick(colorPool) })
    }
  }

  return result
}

// ================================================================
// パターン生成
// ================================================================

export function generateDenseBlend(colors: [string, string, string]): string {
  const [c0, c1, c2] = colors
  const canvas = createCanvas(SIZE)

  // 背景
  canvas.rect(SIZE, SIZE).fill(c0)

  // 各三角形の色は c1 系（明暗 3 種）と c2 系（明暗 2 種）のパレットから選択
  // → 同じ色が連続しにくくなり、ブレンド結果の多様性が増す
  const colorPool = [
    shadeColor(c1, 0.75), shadeColor(c1, 1.0), shadeColor(c1, 1.25),
    shadeColor(c1, 0.75), shadeColor(c1, 1.0), shadeColor(c1, 1.25), // c1 は 2 倍の出現率
    shadeColor(c2, 0.85), shadeColor(c2, 1.15),
  ]

  const tris = generateTriangles(colorPool)
  const N = tris.length

  // ── Step 1: ベース三角形を不透明に描画 ───────────────────────────
  for (const { tri, color } of tris) {
    canvas.path(polyPath([...tri])).fill(color)
  }

  // ── Step 2: 2 枚の重なり領域に screen(c_i, c_j) を塗る ──────────
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const region = clipPolygon([...tris[i].tri], tris[j].tri)
      if (region.length < 3 || polyArea(region) < MIN_AREA) continue

      canvas.path(polyPath(region)).fill(screenBlend(tris[i].color, tris[j].color))
    }
  }

  // ── Step 3: 3 枚の重なり領域に screen(c_i, c_j, c_k) を塗る ────
  // Step 2 で誤って描かれた 2 色ブレンドを正しい 3 色ブレンドで上書きする
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const ij = clipPolygon([...tris[i].tri], tris[j].tri)
      if (ij.length < 3 || polyArea(ij) < MIN_AREA) continue

      for (let k = j + 1; k < N; k++) {
        const ijk = clipPolygon(ij, tris[k].tri)
        if (ijk.length < 3 || polyArea(ijk) < MIN_AREA) continue

        canvas.path(polyPath(ijk)).fill(
          screenBlend(tris[i].color, tris[j].color, tris[k].color),
        )
      }
    }
  }

  return canvas.svg()
}

// ================================================================
// 実行
// ================================================================

const args = process.argv.slice(2)
const colors: [string, string, string] = [
  args[0] ?? '#F0EAE0',
  args[1] ?? '#2A4A7B',
  args[2] ?? '#C4503A',
]

const start = performance.now()
const svg = generateDenseBlend(colors)
const filepath = writeGeneratedSVG('geometric-blend-dense', svg)
const elapsed = (performance.now() - start).toFixed(1)

console.log(`Generated: ${filepath}`)
console.log(`Time: ${elapsed}ms`)
