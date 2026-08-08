/**
 * 壁紙群・丸み版：基本領域 1 枚ぶんの模様を、丸い図形の組み合わせで作る。
 *
 * 直線版（motif-wallpaper.js）と構図・配色のルールは共通で、形だけを丸くする。
 *
 * 1. 地は中心から放射状に切り分けるが、切れ目を円弧状のベジェにする。
 *    となり合う区画が同じ曲線を共有するので、多角形を過不足なく覆う性質は保たれる
 * 2. 頂点に「その内角ぶんの扇形」を置く。基本領域のコピーは頂点のまわりで 2π を
 *    埋めるので、コピーが集まると扇形が合わさって完全な円になる
 * 3. ときどき辺の中点にも半円を置く。辺を共有するとなりのコピーの半円と合わさって円になる
 * 4. 中心には同心円を重ねる
 * 5. 向きのわかる非対称な印（巴形）を中心に置く。巻く向きを固定してあるので、
 *    となりのコピーが回転なのか鏡映なのかすべり鏡なのかが見て取れる
 *
 * 丸い図形も基本領域からはみ出せない（クリップするとコピーの継ぎ目に
 * アンチエイリアスの筋が出る）ので、半径はすべて領域の内側に収まる値で頭打ちにする。
 * 頂点・辺中点の扇形は輪郭に接するが、接する側はとなりのコピーとちょうど噛み合う。
 *
 * 扇形の半径は頂点ごとに変えず、いちばん厳しい頂点に合わせて 1 つに決める。
 * 頂点のまわりに集まるのが基本領域のどの頂点かは群によって違うので、
 * 半径をそろえておかないと合わさった円の縁が欠ける。
 */

import { assignBandColors, accentColor } from './composition.js'
import {
  sectorPolygons,
  simplifyPolygon,
  polygonContains,
  pathContains,
  inradiusFrom,
} from './wallpaper-geometry.js'

const TAU = Math.PI * 2

const fmt = (x) => String(Math.round(x * 100) / 100)
const pt = ([x, y]) => `${fmt(x)},${fmt(y)}`
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const rotate = ([x, y], a) => {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return [x * cos - y * sin, x * sin + y * cos]
}

/** 点 p から辺 (a, b) を通る直線までの距離 */
function lineDistance(a, b, p) {
  const e = [b[0] - a[0], b[1] - a[1]]
  const l = Math.hypot(e[0], e[1]) || 1
  return Math.abs((e[0] * (p[1] - a[1]) - e[1] * (p[0] - a[0])) / l)
}

/* --- 曲線で切り分けた区画 --- */

/** 2 次ベジェのサンプル（始点は含めず、終点は含む） */
function sampleQuad(p0, c, p1, steps) {
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
    ])
  }
  return out
}

/**
 * 中心から放射状に切り分けた区画。切れ目だけを 2 次ベジェにする。
 * 切れ目は 1 本ずつ作ってとなり合う区画で共有するので、隙間も重なりも出ない。
 *
 * bulges は切れ目ごとの膨らみ（弦の長さに対する比・符号つき）。
 */
function curvedSectors(polygon, center, angles, bulges) {
  const rings = sectorPolygons(polygon, center, angles)

  const cuts = rings.map((ring, i) => {
    const hit = ring[1]
    const v = [hit[0] - center[0], hit[1] - center[1]]
    const l = Math.hypot(v[0], v[1]) || 1
    const mid = [center[0] + v[0] / 2, center[1] + v[1] / 2]
    // 制御点が領域の内側にあれば、凸性から曲線全体も内側に収まる
    const room = inradiusFrom(polygon, mid) * 0.9
    const h = Math.max(-room, Math.min(room, bulges[i] * l))
    return { hit, ctrl: [mid[0] - (v[1] / l) * h, mid[1] + (v[0] / l) * h] }
  })

  return rings.map((ring, i) => {
    const from = cuts[i]
    const to = cuts[(i + 1) % cuts.length]
    // ring は [中心, 切れ目の足, …輪郭上の頂点…, 切れ目の足]。
    // 末尾は to.hit と同じ点なので、共有している方の値に置き換える
    const between = ring.slice(2, -1)

    const d =
      `M${pt(center)}Q${pt(from.ctrl)} ${pt(from.hit)}` +
      [...between, to.hit].map((p) => `L${pt(p)}`).join('') +
      `Q${pt(to.ctrl)} ${pt(center)}Z`

    const outline = [
      center,
      ...sampleQuad(center, from.ctrl, from.hit, 8),
      ...between,
      to.hit,
      ...sampleQuad(to.hit, to.ctrl, center, 8),
    ]

    return { d, outline }
  })
}

/* --- 扇形 --- */

const piePath = ({ at, r, from, span }) => {
  const a = [at[0] + r * Math.cos(from), at[1] + r * Math.sin(from)]
  const b = [at[0] + r * Math.cos(from + span), at[1] + r * Math.sin(from + span)]
  return `M${pt(at)}L${pt(a)}A${fmt(r)},${fmt(r)} 0 ${span > Math.PI ? 1 : 0} 1 ${pt(b)}Z`
}

function pieContains({ at, r, from, span }, p) {
  const dx = p[0] - at[0]
  const dy = p[1] - at[1]
  if (Math.hypot(dx, dy) > r) return false
  return ((((Math.atan2(dy, dx) - from) % TAU) + TAU) % TAU) <= span
}

/** 各頂点の内角（扇形の向きと開き）と、そこに置ける扇形の半径の上限 */
function polygonCorners(polygon) {
  const n = polygon.length
  return polygon.map((at, i) => {
    const prev = polygon[(i - 1 + n) % n]
    const next = polygon[(i + 1) % n]
    const a1 = Math.atan2(prev[1] - at[1], prev[0] - at[0])
    const a2 = Math.atan2(next[1] - at[1], next[0] - at[0])
    // 凸多角形の内角は π 以下なので、2 辺の間の狭い側が内側
    let delta = a2 - a1
    while (delta <= -Math.PI) delta += TAU
    while (delta > Math.PI) delta -= TAU

    // 頂点に接していない辺までの距離と、となりの頂点の扇形とぶつからない大きさ
    let room = Math.min(distance(prev, at), distance(next, at)) * 0.45
    for (let j = 0; j < n; j++) {
      if (j === i || (j + 1) % n === i) continue
      room = Math.min(room, lineDistance(polygon[j], polygon[(j + 1) % n], at))
    }

    return { at, from: delta >= 0 ? a1 : a2, span: Math.abs(delta), room }
  })
}

/** 各辺の中点に置ける半円（内側を向く）と、その半径の上限 */
function polygonEdges(polygon, inside) {
  const n = polygon.length
  return polygon.map((a, i) => {
    const b = polygon[(i + 1) % n]
    const at = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const l = distance(a, b) || 1
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0])
    // 辺の向きから +π/2 回した向きが法線。角度を +π 掃く側にそれが入る
    const normal = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
    const inward = normal[0] * (inside[0] - at[0]) + normal[1] * (inside[1] - at[1]) > 0

    let room = l * 0.42
    for (let j = 0; j < n; j++) {
      if (j === i) continue
      room = Math.min(room, lineDistance(polygon[j], polygon[(j + 1) % n], at))
    }

    return { at, from: inward ? angle : angle + Math.PI, span: Math.PI, room }
  })
}

/* --- 非対称な印（巴形） --- */

const COMMA_STEPS = 40
const COMMA_CAP_STEPS = 12

/**
 * 中心 at・半径 radius・向き angle の巴形の輪郭。
 *
 * 中心から少し離れたところから内へ巻き込む螺旋を背骨にして、
 * 頭を太く・尾を細く肉付けする。巻く向きが固定なので鏡像とは重ならず、
 * 回転・鏡映・すべり鏡映を見分けられる。
 */
function commaOutline(at, radius, angle) {
  const head = radius * 0.62 // 頭の中心までの距離
  const tail = radius * 0.1 // 尾の先までの距離
  const turn = Math.PI * 1.35 // 巻きの量
  const thick = radius * 0.46 // 頭の太さ

  const spine = (t) => {
    const r = head + (tail - head) * t
    const a = angle + turn * t
    return [at[0] + r * Math.cos(a), at[1] + r * Math.sin(a)]
  }
  const halfWidth = (t) => (thick / 2) * (1 - t) ** 0.8
  const normal = (t) => {
    const a = spine(Math.max(0, t - 1e-3))
    const b = spine(Math.min(1, t + 1e-3))
    const l = distance(a, b) || 1
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
  }

  const left = []
  const right = []
  for (let i = 0; i <= COMMA_STEPS; i++) {
    const t = i / COMMA_STEPS
    const c = spine(t)
    const n = normal(t)
    const w = halfWidth(t)
    left.push([c[0] + n[0] * w, c[1] + n[1] * w])
    right.push([c[0] - n[0] * w, c[1] - n[1] * w])
  }

  // 頭を半円で閉じる。−法線を −π 回すと、接線の逆向きを通って +法線に届く
  const c0 = spine(0)
  const n0 = normal(0)
  const w0 = halfWidth(0)
  const cap = []
  for (let i = 1; i < COMMA_CAP_STEPS; i++) {
    const [x, y] = rotate([-n0[0], -n0[1]], -Math.PI * (i / COMMA_CAP_STEPS))
    cap.push([c0[0] + x * w0, c0[1] + y * w0])
  }

  return [...left, ...right.reverse(), ...cap]
}

/* --- 面積 --- */

function contains(element, p) {
  if (element.kind === 'circle') return distance(element.center, p) <= element.r
  if (element.kind === 'polygon') return pathContains(element.points, p)
  return element.hit.span === undefined
    ? pathContains(element.hit.points, p)
    : pieContains(element.hit, p)
}

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

/* --- 本体 --- */

export function buildMotif({ domain, colorCount, rng }) {
  const { base, circumradius } = domain
  // 頂点の内角と辺の長さを使うので、長さがほぼ 0 の辺を均してから扱う
  const polygon = simplifyPolygon(domain.domain, circumradius * 1e-6)
  const inradius = inradiusFrom(polygon, base)
  const elements = []

  const pie = (shape, colorIndex) => ({
    kind: 'path',
    d: piePath(shape),
    hit: shape,
    colorIndex,
    // 輪郭に接する側でとなりのコピーと噛み合うので、継ぎ目にヘアラインを足す
    hairline: true,
  })

  // --- 地の塗り分け（中心から放射状に切り分け、切れ目を曲線にする） ---
  const sectorCount = Math.min(7, Math.max(3, colorCount + rng.int(0, 2)))
  const widths = Array.from({ length: sectorCount }, () => rng.float(0.6, 1.8))
  const total = widths.reduce((a, b) => a + b, 0)

  const angles = []
  let angle = rng.float(0, TAU)
  for (const width of widths) {
    angles.push(((angle % TAU) + TAU) % TAU)
    angle += (TAU * width) / total
  }
  angles.sort((a, b) => a - b)

  // 膨らみの向きは全部そろえる。区画が風車のように読めて、鏡像との違いが際立つ
  const swirl = rng.chance(0.5) ? 1 : -1
  const bulges = Array.from({ length: sectorCount }, () => swirl * rng.float(0.14, 0.36))

  const sectorColors = assignBandColors(rng, sectorCount, colorCount)
  curvedSectors(polygon, base, angles, bulges).forEach(({ d, outline }, i) => {
    elements.push({
      kind: 'path',
      d,
      hit: { points: outline },
      colorIndex: sectorColors[i],
      // 区画どうし・コピーどうしの継ぎ目に出るアンチエイリアスの隙間を埋める
      hairline: true,
    })
  })
  const groundColors = [...new Set(sectorColors)]

  // --- 頂点の扇形（コピーが集まると円になる） ---
  // 基本領域の面積は群でそろえてあるので、その 1 辺ぶん（√面積）を大きさの基準にする。
  // 内接円を基準にすると群ごとに円の大きさがばらつき、並べたときに見比べにくい
  const unit = Math.sqrt(domain.cellArea / domain.ops.length)
  const corners = polygonCorners(polygon)
  const cornerRadius = Math.min(
    Math.min(...corners.map((c) => c.room)),
    unit * rng.float(0.2, 0.32),
  )
  const cornerColor = accentColor(rng, colorCount, groundColors)
  const withEye = rng.chance(0.45)
  const eyeScale = rng.float(0.34, 0.58)
  const eyeColor = accentColor(rng, colorCount, [...groundColors, cornerColor])

  for (const corner of corners) {
    elements.push(pie({ ...corner, r: cornerRadius }, cornerColor))
  }
  if (withEye) {
    for (const corner of corners) {
      elements.push(pie({ ...corner, r: cornerRadius * eyeScale }, eyeColor))
    }
  }

  // --- 辺の中点の半円（となりのコピーの半円と合わさって円になる） ---
  const edges = polygonEdges(polygon, base)
  const edgeRadius = Math.min(Math.min(...edges.map((e) => e.room)), unit * rng.float(0.16, 0.28))
  const withEdges = rng.chance(0.5)
  const edgeColor = accentColor(rng, colorCount, [...groundColors, cornerColor])
  if (withEdges) {
    for (const edge of edges) {
      elements.push(pie({ ...edge, r: edgeRadius }, edgeColor))
    }
  }

  // --- 中心の同心円 ---
  const ringCount = rng.chance(0.55) ? rng.int(1, 2) : 0
  let ringRadius = inradius
  let topColors = groundColors
  for (let i = 0; i < ringCount; i++) {
    ringRadius *= rng.float(0.5, 0.78)
    const colorIndex = accentColor(rng, colorCount, [...new Set(topColors)])
    elements.push({ kind: 'circle', center: base, r: ringRadius, colorIndex })
    topColors = [colorIndex]
  }

  // --- 非対称な印（これが対称操作の見分けになる） ---
  // 輪の中に収まりきると小さくなりすぎるので、内接円との中間の大きさにする
  const markRadius =
    inradius * rng.float(0.62, 0.88) * Math.sqrt(ringRadius / inradius)
  elements.push({
    kind: 'polygon',
    points: commaOutline(base, markRadius, rng.float(0, TAU)),
    colorIndex: accentColor(rng, colorCount, [...new Set(topColors)]),
  })

  // --- 隠れて見えなくなった色を、点で補う ---
  let counts = visibleAreas(elements, polygon, colorCount)
  for (let color = 0; color < colorCount; color++) {
    if (counts[color] > 0) continue
    // 中心から外へずらした位置に、輪郭からはみ出さない大きさで置く
    for (let attempt = 0; attempt < 12; attempt++) {
      const theta = rng.float(0, TAU)
      const away = inradius * rng.float(0.45, 0.8)
      const center = [base[0] + away * Math.cos(theta), base[1] + away * Math.sin(theta)]
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
