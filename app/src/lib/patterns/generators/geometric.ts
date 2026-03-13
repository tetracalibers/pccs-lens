import { createCanvas, pick } from './utils.js'

const SIZE = 300
const GRID = 10
const CELL = SIZE / GRID // 30px

/**
 * 3色の HEX カラーコードを受け取りジオメトリックパターンを生成する。
 * colors[0]: 最も使用面積が大きい色
 * colors[1]: 中程度の使用面積
 * colors[2]: 最も使用面積が小さい色
 */
export function generateGeometric(colors: [string, string, string]): string {
  const [c0, c1, c2] = colors

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
        canvas
          .path(`M ${x},${y} L ${x + CELL},${y} L ${x},${y + CELL} Z`)
          .fill(colorA)
          .stroke({ width: 0 })
        canvas
          .path(`M ${x + CELL},${y} L ${x + CELL},${y + CELL} L ${x},${y + CELL} Z`)
          .fill(colorB)
          .stroke({ width: 0 })
      } else {
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
