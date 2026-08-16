/**
 * 壁紙群版：基本領域 1 枚ぶんの模様を組み立てる。
 *
 * 17 群を見比べるのが目的なので、どの群でも同じ組み立て方をする。
 *
 * 1. 基本領域を中心から放射状に切り分けて塗る（地）。多角形を過不足なく覆うので、
 *    群の変換と平行移動でコピーすると平面が塗り残しなく埋まる
 * 2. ときどき中心に入れ子の輪を重ねる
 * 3. mark を指定したときだけ、向きのわかる非対称な印（F 字）を中心に置く。
 *    これがあると、となりのコピーが回転なのか鏡映なのかすべり鏡なのかが見て取れる。
 *    ただし文字に読めて模様から浮くので、この版は既定では置かない（--mark で置ける）
 *
 * 帯の分割・配色・アクセント色のルールはロゼッタ版と共通（composition.js）。
 * 使用面積はマス目版と同じく、最後に数えて色の順序を確定させる。
 */

import { assignBandColors, accentColor } from './composition.js'
import {
  sectorPolygons,
  scalePolygon,
  polygonContains,
  pathContains,
  inradiusFrom,
} from './wallpaper-geometry.js'

/**
 * 非対称な印の輪郭（F 字）。
 * 左上を原点とする 0.62 × 1 の箱に収めた 10 頂点の多角形。
 * 上下も左右も対称でないので、回転・鏡映・すべり鏡を見分けられる。
 */
const MARK = [
  [0, 0],
  [0.62, 0],
  [0.62, 0.2],
  [0.22, 0.2],
  [0.22, 0.38],
  [0.52, 0.38],
  [0.52, 0.58],
  [0.22, 0.58],
  [0.22, 1],
  [0, 1],
]

const MARK_CENTER = [0.31, 0.5]
const MARK_RADIUS = Math.hypot(0.31, 0.5)

/** 印を中心 at・半径 radius・角度 angle で置いたときの輪郭 */
function markPolygon(at, radius, angle) {
  const k = radius / MARK_RADIUS
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return MARK.map(([x, y]) => {
    const dx = (x - MARK_CENTER[0]) * k
    const dy = (y - MARK_CENTER[1]) * k
    return [at[0] + dx * cos - dy * sin, at[1] + dx * sin + dy * cos]
  })
}

const contains = (element, p) =>
  element.kind === 'circle'
    ? Math.hypot(p[0] - element.center[0], p[1] - element.center[1]) <= element.r
    : pathContains(element.points, p)

/**
 * 基本領域を細かくサンプルして、実際に見えている面積を色ごとに数える。
 * 上に重ねた要素に隠れたぶんは数えないので、隠れて消えた色も見つけられる。
 */
function visibleAreas(elements, polygon, colorCount) {
  const xs = polygon.map((p) => p[0])
  const ys = polygon.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const steps = 96
  const counts = new Array(colorCount).fill(0)

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const p = [
        minX + ((i + 0.5) / steps) * (maxX - minX),
        minY + ((j + 0.5) / steps) * (maxY - minY),
      ]
      if (!polygonContains(polygon, p)) continue
      for (let k = elements.length - 1; k >= 0; k--) {
        if (contains(elements[k], p)) {
          counts[elements[k].colorIndex]++
          break
        }
      }
    }
  }

  return counts
}

export function buildMotif({ domain, colorCount, rng, mark = true }) {
  const { domain: polygon, base, inradius } = domain
  const elements = []

  // --- 地の塗り分け（中心から放射状に切り分ける） ---
  const sectorCount = Math.min(7, Math.max(3, colorCount + rng.int(0, 2)))
  const widths = Array.from({ length: sectorCount }, () => rng.float(0.6, 1.8))
  const total = widths.reduce((a, b) => a + b, 0)

  const tau = Math.PI * 2
  const angles = []
  let angle = rng.float(0, tau)
  for (const width of widths) {
    angles.push(((angle % tau) + tau) % tau)
    angle += (tau * width) / total
  }
  angles.sort((a, b) => a - b)

  const sectorColors = assignBandColors(rng, sectorCount, colorCount)
  sectorPolygons(polygon, base, angles).forEach((points, i) => {
    elements.push({
      kind: 'polygon',
      points,
      colorIndex: sectorColors[i],
      // 区画どうし・コピーどうしの継ぎ目に出るアンチエイリアスの隙間を埋める
      hairline: true,
    })
  })

  // --- 入れ子の輪（中心に重ねる相似形） ---
  const ringCount = rng.chance(0.55) ? rng.int(1, 2) : 0
  let ringScale = 1
  let topColors = sectorColors
  for (let i = 0; i < ringCount; i++) {
    ringScale *= rng.float(0.45, 0.72)
    const colorIndex = accentColor(rng, colorCount, [...new Set(topColors)])
    elements.push({
      kind: 'polygon',
      points: scalePolygon(polygon, base, ringScale),
      colorIndex,
      hairline: true,
    })
    topColors = [colorIndex]
  }

  // --- 非対称な印（これが対称操作の見分けになる） ---
  // 印を置くかどうかで乱数の引き方が変わるのは印より後だけなので、
  // 同じ seed なら地の切り分けと配色はどちらでも同じになる
  if (mark) {
    const markRadius = inradius * rng.float(0.62, 0.88) * ringScale ** 0.35
    elements.push({
      kind: 'polygon',
      points: markPolygon(base, markRadius, rng.float(0, tau)),
      colorIndex: accentColor(rng, colorCount, [...new Set(topColors)]),
    })
  }

  // --- 隠れて見えなくなった色を、点で補う ---
  let counts = visibleAreas(elements, polygon, colorCount)
  for (let color = 0; color < colorCount; color++) {
    if (counts[color] > 0) continue
    // 中心から外へずらした位置に、輪郭からはみ出さない大きさで置く
    for (let attempt = 0; attempt < 12; attempt++) {
      const theta = rng.float(0, tau)
      const distance = inradius * rng.float(0.45, 0.8)
      const center = [base[0] + distance * Math.cos(theta), base[1] + distance * Math.sin(theta)]
      const room = inradiusFrom(polygon, center)
      if (room < inradius * 0.12) continue
      elements.push({
        kind: 'circle',
        center,
        r: Math.min(room * 0.7, inradius * 0.22),
        colorIndex: color,
      })
      break
    }
    counts = visibleAreas(elements, polygon, colorCount)
  }

  // --- 使用面積の大きい順に色を並べ替える ---
  // 実際に見えている面積を数えてから並べ替えるので、
  // 「インデックスが小さい色ほど使用面積が大きい」を確実に満たせる。
  // 色の入れ替えなので、隣り合う区画やアクセントと下地が同色にならない性質は保たれる。
  const rank = new Array(colorCount)
  counts
    .map((area, color) => [area, color])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, color], index) => {
      rank[color] = index
    })
  for (const element of elements) element.colorIndex = rank[element.colorIndex]

  return { elements, areas: counts.map((_, c) => counts[c]) }
}
