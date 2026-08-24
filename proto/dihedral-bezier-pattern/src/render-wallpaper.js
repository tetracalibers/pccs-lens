/**
 * 壁紙群の模様を SVG にする。
 *
 * 3 段階の <use> で組み立てる。
 * 1. 基本領域 1 枚ぶんの模様
 * 2. 群の変換をすべて掛けて、単位格子 1 枚ぶんにする
 * 3. 単位格子を平行移動でキャンバスに敷き詰める
 *
 * --guide のときは、その上に対称性の要素（単位格子・基本領域の輪郭・
 * 回転中心・鏡・すべり鏡）を重ねる。
 */

import { BACKGROUND } from './palettes.js'
import { regularPolygonPath } from './geometry.js'
import { symmetryElements, latticeRange } from './wallpaper-geometry.js'

const num = (x) => String(Math.round(x * 100) / 100)
const point = ([x, y]) => `${num(x)},${num(y)}`
const polygonPath = (points) => `M${points.map(point).join('L')}Z`

/** SVG の matrix(a,b,c,d,e,f) は (x,y) を (a·x + c·y + e, b·x + d·y + f) に写す */
const matrixOf = ({ A, c }) =>
  `matrix(${num(A[0][0])},${num(A[1][0])},${num(A[0][1])},${num(A[1][1])},${num(c[0])},${num(c[1])})`

function renderElement(element, colors) {
  const color = colors[element.colorIndex]
  if (element.kind === 'circle') {
    return (
      `<circle cx="${num(element.center[0])}" cy="${num(element.center[1])}"` +
      ` r="${num(element.r)}" fill="${color}"/>`
    )
  }
  // 継ぎ目埋めのヘアライン。基本領域どうしの境目に白い筋が出るのを防ぐ
  const hairline = element.hairline
    ? ` stroke="${color}" stroke-width="0.7" stroke-linejoin="round"`
    : ''
  // kind: 'path' は円弧やベジェを含む輪郭。モチーフ側で組み立てた d をそのまま使う
  const d = element.kind === 'path' ? element.d : polygonPath(element.points)
  return `<path d="${d}" fill="${color}"${hairline}/>`
}

/* --- ガイド --- */

const INK = '#1A1A1A'

/** 回転中心の印。次数に合わせて形を変える（2 はレンズ、3・4・6 は正多角形） */
function centerMarker(order, r) {
  if (order === 2) {
    return `M${num(-r)},0Q0,${num(-r * 0.62)} ${num(r)},0Q0,${num(r * 0.62)} ${num(-r)},0Z`
  }
  return regularPolygonPath(order, r, -Math.PI / 2)
}

function renderGuides(domain, { range, reach, unit, offset }) {
  const { t1, t2, ops, domain: fundamental } = domain
  const line = unit * 0.22
  const parts = []

  // 基本領域の輪郭（群の変換ぶんを 1 つの <g> にまとめて、格子で敷き詰める）
  const cellFrames = ops
    .map((op) => `      <use href="#frame" xlink:href="#frame" transform="${matrixOf(op)}"/>`)
    .join('\n')

  const tiles = []
  for (let m = range.fromM; m <= range.toM; m++) {
    for (let n = range.fromN; n <= range.toN; n++) {
      const dx = m * t1[0] + n * t2[0]
      const dy = m * t1[1] + n * t2[1]
      tiles.push(
        `      <use href="#cellguide" xlink:href="#cellguide" transform="translate(${num(dx)},${num(dy)})"/>`,
      )
    }
  }

  // 鏡・すべり鏡は直線なので、描画範囲を覆う長さで引いて viewport で切る。
  // 範囲の外まで伸びている軸は描いても見えないので落とす。
  const { centers, axes } = symmetryElements(
    domain,
    Math.max(range.toM - range.fromM, range.toN - range.fromN),
  )
  const near = (p) => Math.hypot(p[0] - offset.center[0], p[1] - offset.center[1]) < reach * 0.75

  const rules = axes
    .filter(({ through, direction }) => {
      const d = [offset.center[0] - through[0], offset.center[1] - through[1]]
      return Math.abs(d[0] * direction[1] - d[1] * direction[0]) < reach * 0.75
    })
    .map(({ through, direction, glide }) => {
      const a = [through[0] - direction[0] * reach, through[1] - direction[1] * reach]
      const b = [through[0] + direction[0] * reach, through[1] + direction[1] * reach]
      const dash = glide ? ` stroke-dasharray="${num(unit * 1.1)} ${num(unit * 0.7)}"` : ''
      return (
        `    <path d="M${point(a)}L${point(b)}" stroke="${INK}" stroke-opacity="0.85"` +
        ` stroke-width="${num(line * (glide ? 1 : 1.6))}"${dash}/>`
      )
    })
    .join('\n')

  const marks = centers
    .filter(({ at }) => near(at))
    .map(
      ({ at, order }) =>
        `    <path d="${centerMarker(order, unit * 0.6)}" transform="translate(${point(at)})"` +
        ` fill="#FFFFFF" stroke="${INK}" stroke-width="${num(line)}"/>`,
    )
    .join('\n')

  parts.push(`  <defs>
    <path id="frame" d="${polygonPath(fundamental)}" fill="none" stroke="${INK}"
      stroke-opacity="0.35" stroke-width="${num(line * 0.8)}"
      stroke-dasharray="${num(unit * 0.3)} ${num(unit * 0.3)}"/>
    <path id="cellbox" d="${polygonPath([[0, 0], t1, [t1[0] + t2[0], t1[1] + t2[1]], t2])}"
      fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="${num(line)}"/>
    <g id="cellguide">
${cellFrames}
      <use href="#cellbox" xlink:href="#cellbox"/>
    </g>
  </defs>`)

  parts.push(`  <g>\n${tiles.join('\n')}\n  </g>`)
  parts.push(`  <g>\n${rules}\n  </g>`)
  parts.push(`  <g>\n${marks}\n  </g>`)

  return parts.join('\n')
}

/* --- 本体 --- */

export function renderWallpaperSVG({ domain, motif, colors, size, seed, guide = false }) {
  const { name, ops, t1, t2, pointGroup } = domain

  // 単位格子の中心をキャンバスの中心に合わせる
  const shift = [size / 2 - (t1[0] + t2[0]) / 2, size / 2 - (t1[1] + t2[1]) / 2]
  const corners = [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size],
  ].map(([x, y]) => [x - shift[0], y - shift[1]])
  const range = latticeRange(domain, corners)

  const motifBody = motif.elements
    .map((element) => `      ${renderElement(element, colors)}`)
    .join('\n')

  const copies = ops
    .map((op) => `      <use href="#motif" xlink:href="#motif" transform="${matrixOf(op)}"/>`)
    .join('\n')

  const tiles = []
  for (let m = range.fromM; m <= range.toM; m++) {
    for (let n = range.fromN; n <= range.toN; n++) {
      const dx = m * t1[0] + n * t2[0]
      const dy = m * t1[1] + n * t2[1]
      tiles.push(
        `    <use href="#cell" xlink:href="#cell" transform="translate(${num(dx)},${num(dy)})"/>`,
      )
    }
  }

  const guides = guide
    ? '\n' +
      renderGuides(domain, {
        range,
        reach: size,
        unit: Math.sqrt(domain.cellArea / ops.length) / 6,
        offset: { center: [size / 2 - shift[0], size / 2 - shift[1]] },
      })
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- wallpaper group ${name} / point group ${pointGroup} / ${ops.length} operations per cell / colors: ${colors.join(' ')} / seed: ${seed} -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <defs>
    <g id="motif">
${motifBody}
    </g>
    <g id="cell">
${copies}
    </g>
  </defs>
  <g transform="translate(${num(shift[0])},${num(shift[1])})">
${tiles.join('\n')}${guides}
  </g>
</svg>
`
}
