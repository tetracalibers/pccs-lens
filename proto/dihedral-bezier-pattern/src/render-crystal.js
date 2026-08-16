/**
 * 準結晶版を SVG にする。
 *
 * 画面はいつも原点を中心に切り取るので（結晶核を中心に置くのがこの版の趣旨）、
 * 変換はタイリングの座標系（y は上向き）から SVG の座標系（y は下向き）へ写すだけ。
 *
 * 層によっては線が数千本になるので、**同じ描き方の線は 1 本の `<path>` にまとめる**
 * （`M …L…` を並べる）。まとめないとファイルが数百 KB に膨らむ。
 */

import { BACKGROUND } from './palettes.js'

const num = (x) => String(Math.round(x * 100) / 100)

export function renderCrystalSVG({ motif, colors, size, seed, unit, growth, layers, note }) {
  const half = size / 2
  const at = ([x, y]) => `${num(x + half)},${num(half - y)}`

  const body = motif.groups.map((group) => renderGroup(group, at)).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Penrose P2 quasicrystal / tiles: ${motif.tiles} / unit: ${num(unit)} / growth: ${num(growth)} / layers: ${layers.join(',')} / ${note} / colors: ${colors.join(' ')} / seed: ${seed} -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
${body}
</svg>
`
}

function renderGroup(group, at) {
  if (group.kind === 'fill') return renderFills(group, at)
  if (group.kind === 'stroke') return renderStrokes(group, at)
  if (group.kind === 'dot') return renderShapes(group, at, circlePath(at))
  if (group.kind === 'decagon') return renderShapes(group, at, decagonPath(at))
  return ''
}

/** タイルの面。1 枚ずつ色が違うので、まとめずに書き出す */
function renderFills(group, at) {
  const paths = group.items
    .map((item) => {
      const d = 'M' + item.points.map(at).join('L') + 'Z'
      const opacity = item.opacity < 1 ? ` fill-opacity="${num(item.opacity)}" stroke-opacity="${num(item.opacity)}"` : ''
      // 隣り合うタイルの継ぎ目に出るアンチエイリアスの白い筋を、同色のヘアラインで埋める
      return `    <path d="${d}" fill="${item.color}" stroke="${item.color}" stroke-width="0.7" stroke-linejoin="round"${opacity}/>`
    })
    .join('\n')
  return `  <g id="${group.name}">\n${paths}\n  </g>`
}

/** 同じ太さ・同じ色の線を 1 本の path にまとめる */
function renderStrokes(group, at) {
  const d = group.segments.map(([a, b]) => `M${at(a)}L${at(b)}`).join('')
  return (
    `  <path id="${group.name}" d="${d}" fill="none" stroke="${group.stroke}"` +
    ` stroke-width="${num(group.width)}" stroke-opacity="${num(group.opacity)}"` +
    ` stroke-linecap="round"/>`
  )
}

/**
 * 点や節点の集まり。濃さが 1 つずつ違うので、0.05 刻みの段に丸めてから、
 * 段ごとに 1 本の path にまとめる。
 */
function renderShapes(group, at, toPath) {
  const buckets = new Map()
  for (const item of group.items) {
    const key = Math.round((item.opacity ?? 1) * 20)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(item)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, items]) => {
      const d = items.map(toPath).join('')
      return `  <path id="${group.name}-${key}" d="${d}" fill="${group.color}" fill-opacity="${num(key / 20)}"/>`
    })
    .join('\n')
}

/** 円は円弧 2 つで書く */
const circlePath = (at) => ({ c, r }) => {
  const left = at([c[0] - r, c[1]])
  const right = at([c[0] + r, c[1]])
  return `M${left}A${num(r)},${num(r)} 0 1,0 ${right}A${num(r)},${num(r)} 0 1,0 ${left}Z`
}

/** 5 回対称の頂点（太陽・星）に置く十角形の節点 */
const decagonPath = (at) => ({ c, r }) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5
    return at([c[0] + r * Math.cos(angle), c[1] + r * Math.sin(angle)])
  })
  return 'M' + points.join('L') + 'Z'
}
