import { Svg } from '@svgdotjs/svg.js'
import { createCanvas, writeGeneratedSVG, rand, pick } from './utils.js'

const SIZE = 300
const COLS = 6
const ROWS = 6
const CELL = SIZE / COLS // 50px

type Rotation = 0 | 90 | 180 | 270
type ShapeType =
  | 'rect'
  | 'half-rect'
  | 'circle'
  | 'semicircle'
  | 'quarter-circle'
  | 'hline'
  | 'vline'

const ALL_SHAPES: ShapeType[] = [
  'rect',
  'half-rect',
  'circle',
  'semicircle',
  'quarter-circle',
  'hline',
  'vline',
]
const LARGE_SHAPES: ShapeType[] = ['rect', 'circle', 'semicircle', 'quarter-circle']
const ROTATIONS: Rotation[] = [0, 90, 180, 270]

/**
 * セルに図形を描画する。回転はセル中心を軸にする。
 * clipPath によりセル境界外へのはみ出しを防ぐ。
 */
function drawShape(
  canvas: Svg,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shape: ShapeType,
  rotation: Rotation,
): void {
  const cx = x + w / 2
  const cy = y + h / 2
  const r = Math.min(w, h) / 2

  // クリップグループ（キャンバス座標系でセル範囲を制限）
  const outer = canvas.group()
  const clip = canvas.clip().add(canvas.rect(w, h).move(x, y))
  outer.clipWith(clip)

  // 回転グループ（セル中心を軸に回転）
  const g = outer.group()
  if (rotation !== 0) {
    g.rotate(rotation, cx, cy)
  }

  switch (shape) {
    case 'rect':
      g.rect(w, h).move(x, y).fill(color)
      break

    case 'half-rect':
      // 上半分の矩形。回転で各辺方向を表現
      g.rect(w, h / 2).move(x, y).fill(color)
      break

    case 'circle':
      g.circle(r * 2).move(cx - r, cy - r).fill(color)
      break

    case 'semicircle': {
      // 上半円（中心線より上の半円）
      // SVG では sweep=0 で左→右に上方向弧を描く
      const d = `M ${cx - r},${cy} A ${r},${r} 0 0,0 ${cx + r},${cy} Z`
      g.path(d).fill(color)
      break
    }

    case 'quarter-circle': {
      // 左上コーナーを中心とする扇形（セルを覆う 1/4 円）
      const d = `M ${x + w},${y} A ${w},${h} 0 0,0 ${x},${y + h} L ${x},${y} Z`
      g.path(d).fill(color)
      break
    }

    case 'hline':
      // セル中央を通る太い横帯
      g.rect(w, h * 0.25).move(x, cy - h * 0.125).fill(color)
      break

    case 'vline':
      // セル中央を通る太い縦帯
      g.rect(w * 0.25, h).move(cx - w * 0.125, y).fill(color)
      break
  }
}

/**
 * 3色の HEX カラーコードを受け取りバウハウスパターンを生成する。
 * colors[0]: 最も使用面積が大きい色（背景）
 * colors[1]: 中程度の使用面積
 * colors[2]: 最も使用面積が小さい色
 */
export function generateBauhaus(colors: [string, string, string]): string {
  const [bg, c1, c2] = colors
  const canvas = createCanvas(SIZE)

  // 背景
  canvas.rect(SIZE, SIZE).fill(bg)

  const key = (r: number, c: number) => `${r},${c}`
  const occupied = new Set<string>()

  // 2×2 セルを結合した大きい図形（2〜4 箇所）
  const mergeCount = rand(2, 4)
  let merged = 0
  for (let attempt = 0; attempt < 50 && merged < mergeCount; attempt++) {
    const row = rand(0, ROWS - 2)
    const col = rand(0, COLS - 2)
    const keys = [
      key(row, col),
      key(row, col + 1),
      key(row + 1, col),
      key(row + 1, col + 1),
    ]
    if (keys.every(k => !occupied.has(k))) {
      keys.forEach(k => occupied.add(k))
      const color = Math.random() < 0.6 ? c1 : c2
      drawShape(
        canvas,
        col * CELL,
        row * CELL,
        CELL * 2,
        CELL * 2,
        color,
        pick(LARGE_SHAPES),
        pick(ROTATIONS),
      )
      merged++
    }
  }

  // 個別セル
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (occupied.has(key(row, col))) continue
      if (Math.random() < 0.2) continue // 20% は空（背景のみ）

      const color = Math.random() < 0.65 ? c1 : c2
      drawShape(
        canvas,
        col * CELL,
        row * CELL,
        CELL,
        CELL,
        color,
        pick(ALL_SHAPES),
        pick(ROTATIONS),
      )
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
const svg = generateBauhaus(colors)
const filepath = writeGeneratedSVG('bauhaus', svg)
const elapsed = (performance.now() - start).toFixed(1)

console.log(`Generated: ${filepath}`)
console.log(`Time: ${elapsed}ms`)
