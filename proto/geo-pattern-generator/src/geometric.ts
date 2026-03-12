import { createCanvas, writeGeneratedSVG, pick } from './utils.js'

const SIZE = 300
const GRID = 10 // 10×10 グリッド
const CELL = SIZE / GRID // 30px

/**
 * 3色の HEX カラーコードを受け取りジオメトリックパターンを生成する。
 * colors[0]: 最も使用面積が大きい色
 * colors[1]: 中程度の使用面積
 * colors[2]: 最も使用面積が小さい色
 *
 * パターン: 同じサイズの直角三角形をランダムな方向で敷き詰めたタイリング。
 * 各正方形セルを対角線で 2 つの直角三角形に分割し、
 * 対角線の向き（\または/）をランダムに選択する。
 */
export function generateGeometric(colors: [string, string, string]): string {
  const [c0, c1, c2] = colors

  // 色の使用比率: c0 が最大面積、c2 が最小面積
  const colorPool = [
    ...Array<string>(5).fill(c0), // 約 50%
    ...Array<string>(3).fill(c1), // 約 30%
    ...Array<string>(2).fill(c2), // 約 20%
  ]

  const canvas = createCanvas(SIZE)

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = col * CELL
      const y = row * CELL

      const colorA = pick(colorPool)
      const colorB = pick(colorPool)

      if (Math.random() > 0.5) {
        // \ 対角線: 左上三角 + 右下三角
        canvas
          .path(`M ${x},${y} L ${x + CELL},${y} L ${x},${y + CELL} Z`)
          .fill(colorA)
          .stroke({ width: 0 })
        canvas
          .path(`M ${x + CELL},${y} L ${x + CELL},${y + CELL} L ${x},${y + CELL} Z`)
          .fill(colorB)
          .stroke({ width: 0 })
      } else {
        // / 対角線: 右上三角 + 左下三角
        canvas
          .path(`M ${x},${y} L ${x + CELL},${y} L ${x + CELL},${y + CELL} Z`)
          .fill(colorA)
          .stroke({ width: 0 })
        canvas
          .path(`M ${x},${y} L ${x + CELL},${y + CELL} L ${x},${y + CELL} Z`)
          .fill(colorB)
          .stroke({ width: 0 })
      }
    }
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
const svg = generateGeometric(colors)
const filepath = writeGeneratedSVG('geometric', svg)
const elapsed = (performance.now() - start).toFixed(1)

console.log(`Generated: ${filepath}`)
console.log(`Time: ${elapsed}ms`)
