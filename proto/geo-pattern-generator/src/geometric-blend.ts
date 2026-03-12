/**
 * パターン: さまざまな形状の三角形をランダム配置し、重なり合う部分の色をブレンドするパターン
 *
 * 三角形をキャンバス上にランダムに散布し、SVG の mix-blend-mode: multiply で
 * 重なり部分を暗く混合する（透明水彩の重ね塗りのような効果）。
 * サイズ・形状・角度・位置がすべてランダムで、配置のたびに異なる構図を生成する。
 *
 * 注意: ブレンド効果はブラウザ等の SVG レンダラで確認できる。
 *       明るい背景色（colors[0]）と使うと混合結果が最も見やすい。
 */
import { createCanvas, writeGeneratedSVG, rand } from './utils.js'

const SIZE = 300

/**
 * ランダムな形状・サイズ・向きの三角形 SVG パス文字列を生成する。
 * キャンバス外にはみ出す場合もある（SVG の自然なクリッピングに任せる）。
 */
function randomTrianglePath(): string {
  // 重心（キャンバス外も許容して端まで三角形が届くようにする）
  const margin = 80
  const gx = rand(-margin, SIZE + margin)
  const gy = rand(-margin, SIZE + margin)

  // 小 / 中 / 大 の 3 サイズクラスを均等に選択
  const sizeRanges = [
    [30, 75],
    [65, 130],
    [110, 210],
  ] as const
  const baseR = rand(...sizeRanges[Math.floor(Math.random() * 3)])

  // 3 頂点: 基準角度から角度間隔をランダムにずらして多様な形を生成
  const base = Math.random() * Math.PI * 2
  const a1 = base
  const a2 = base + Math.PI * (0.4 + Math.random() * 1.2)
  const a3 = base + Math.PI * (0.4 + Math.random() * 1.2) + Math.PI * (0.4 + Math.random() * 1.2)

  // 各頂点の半径にもランダムなスケールを加えて不規則な形にする
  const r1 = baseR * (0.5 + Math.random() * 0.8)
  const r2 = baseR * (0.5 + Math.random() * 0.8)
  const r3 = baseR * (0.5 + Math.random() * 0.8)

  const x1 = (gx + Math.cos(a1) * r1).toFixed(1)
  const y1 = (gy + Math.sin(a1) * r1).toFixed(1)
  const x2 = (gx + Math.cos(a2) * r2).toFixed(1)
  const y2 = (gy + Math.sin(a2) * r2).toFixed(1)
  const x3 = (gx + Math.cos(a3) * r3).toFixed(1)
  const y3 = (gy + Math.sin(a3) * r3).toFixed(1)

  return `M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} Z`
}

export function generateBlendedTriangles(colors: [string, string, string]): string {
  const canvas = createCanvas(SIZE)

  // 背景: colors[0]（明るい色が混合の見栄えに向いている）
  canvas.rect(SIZE, SIZE).fill(colors[0])

  // multiply ブレンドで散布
  // c1 約 60%、c2 約 40% の割合で使用（面積比を近似）
  const count = rand(18, 28)
  for (let i = 0; i < count; i++) {
    const color = Math.random() < 0.6 ? colors[1] : colors[2]

    // opacity はあえて変えず mix-blend-mode のみで混合させる
    // （opacity < 1 にすると stacking context が作られ、背景との blend が分離する）
    canvas.path(randomTrianglePath()).fill(color).attr('style', 'mix-blend-mode: multiply')
  }

  return canvas.svg()
}

// --- 実行 ---
const args = process.argv.slice(2)
const colors: [string, string, string] = [
  args[0] ?? '#F0EAE0',
  args[1] ?? '#2A4A7B',
  args[2] ?? '#C4503A',
]

const start = performance.now()
const svg = generateBlendedTriangles(colors)
const filepath = writeGeneratedSVG('geometric-blend', svg)
const elapsed = (performance.now() - start).toFixed(1)

console.log(`Generated: ${filepath}`)
console.log(`Time: ${elapsed}ms`)
