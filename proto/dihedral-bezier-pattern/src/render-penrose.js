/**
 * 五角形ペンローズタイリングを SVG にする。
 *
 * タイリングは繰り返さないので <use> は使えず、タイルを 1 枚ずつ書き出す。
 * タイリングの座標系（y は上向き）から SVG の座標系（y は下向き）へ、
 * 切り取り位置ぶんずらしながら写す。
 */

import { BACKGROUND } from './palettes.js'

const num = (x) => String(Math.round(x * 100) / 100)

export function renderPenroseSVG({ motif, colors, size, seed, view, side, outline }) {
  const half = size / 2
  const toPath = (points) =>
    'M' +
    points
      .map(([x, y]) => `${num(x - view.x + half)},${num(half - (y - view.y))}`)
      .join('L') +
    'Z'

  const body = motif.elements
    .map((element) => {
      const color = colors[element.colorIndex]
      // 輪郭なしのときは、隣り合うタイルの継ぎ目に出るアンチエイリアスの
      // 白い筋を同色のヘアラインで埋める
      const stroke = outline
        ? ` stroke="${BACKGROUND}" stroke-width="${num(Math.max(0.6, side * 0.045))}"`
        : ` stroke="${color}" stroke-width="0.7"`
      return `  <path d="${toPath(element.points)}" fill="${color}"${stroke} stroke-linejoin="round"/>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Penrose P1 (pentagon/star/boat/diamond) / tiles: ${motif.elements.length} / side: ${num(side)} / colors: ${colors.join(' ')} / seed: ${seed} -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
${body}
</svg>
`
}
