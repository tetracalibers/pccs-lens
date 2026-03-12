/**
 * パターン: 濃淡と形状の異なる三角形をローポリゴン風にタイリングするパターン
 *
 * Bowyer-Watson アルゴリズムでドロネー三角形分割を行い、
 * 各面の 3D 法線ベクトルと疑似ライティングで明暗を計算する。
 * ランダムな点配置と分割により、グリッドを意識しない
 * 有機的な低多角形メッシュを生成する。
 */
import { createCanvas, writeGeneratedSVG, pick, shadeColor } from './utils.js'
import { generatePoints, triangulate, triPath, type Tri } from './delaunay.js'

const SIZE = 300

// ================================================================
// 擬似ライティング
// ================================================================

// 実行ごとに異なる地形を作るランダム位相
const PX = Math.random() * Math.PI * 2
const PY = Math.random() * Math.PI * 2

/**
 * 各頂点の「高さ」を正弦波の重ね合わせで定義する。
 * これにより滑らかな擬似地形が生まれ、三角形ごとに異なる傾きが生まれる。
 */
function heightAt(x: number, y: number): number {
  const nx = x / SIZE
  const ny = y / SIZE
  return (
    Math.sin(nx * 5.1 * Math.PI + PX) * Math.cos(ny * 4.3 * Math.PI + PY) * 1.0 +
    Math.cos(nx * 8.7 * Math.PI + PY) * Math.sin(ny * 7.1 * Math.PI + PX) * 0.6 +
    Math.sin((nx + ny) * 6.3 * Math.PI + PX * 0.5) * 0.4
  )
}

/**
 * 三角形の 3 頂点の高さから面法線を計算し、
 * 光源方向とのドット積で拡散反射照度（0〜1）を返す。
 */
function diffuseLighting(tri: Tri): number {
  const Z_SCALE = 55 // 高さ方向の拡大率（大きいほど明暗コントラストが強い）

  const ha = heightAt(tri.a.x, tri.a.y)
  const hb = heightAt(tri.b.x, tri.b.y)
  const hc = heightAt(tri.c.x, tri.c.y)

  // 2辺ベクトル（z 付き 3D）
  const abx = tri.b.x - tri.a.x, aby = tri.b.y - tri.a.y, abz = (hb - ha) * Z_SCALE
  const acx = tri.c.x - tri.a.x, acy = tri.c.y - tri.a.y, acz = (hc - ha) * Z_SCALE

  // 外積 → 面法線
  let nx = aby * acz - abz * acy
  let ny = abz * acx - abx * acz
  let nz = abx * acy - aby * acx
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
  if (nLen < 1e-8) return 0.5
  nx /= nLen; ny /= nLen; nz /= nLen
  if (nz < 0) { nx = -nx; ny = -ny; nz = -nz } // カメラ側を向く法線に統一

  // 光源方向: 左上斜め上から照射（正規化済み）
  const LX = -0.4, LY = -0.35, LZ = 0.85
  const lLen = Math.sqrt(LX * LX + LY * LY + LZ * LZ)

  // 拡散反射 + アンビエント
  const diffuse = Math.max(0, (nx * LX + ny * LY + nz * LZ) / lLen)
  return 0.15 + diffuse * 0.85 // ambient 15% + diffuse 85%
}

// ================================================================
// パターン生成
// ================================================================

export function generateShadeTiling(colors: [string, string, string]): string {
  const [c0, c1, c2] = colors
  const canvas = createCanvas(SIZE)

  // 色の使用比率: c0 が最大面積
  const colorPool = [
    ...Array<string>(5).fill(c0),
    ...Array<string>(3).fill(c1),
    ...Array<string>(2).fill(c2),
  ]

  const pts = generatePoints(65, SIZE) // 内部点 65 個 → 三角形約 130〜160 個
  const tris = triangulate(pts)

  for (const tri of tris) {
    const light = diffuseLighting(tri) // 0.15〜1.0
    const base = pick(colorPool)

    // 照度を shadeColor の係数にマップ（暗い面 0.45 〜 明るい面 1.45）
    const factor = 0.45 + light * 1.0
    const color = shadeColor(base, factor)

    // 同色の細いストロークで隣接面の微細なレンダリングギャップを埋める
    canvas.path(triPath(tri)).fill(color).stroke({ color, width: 0.8 })
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
const svg = generateShadeTiling(colors)
const filepath = writeGeneratedSVG('geometric-shade', svg)
const elapsed = (performance.now() - start).toFixed(1)

console.log(`Generated: ${filepath}`)
console.log(`Time: ${elapsed}ms`)
