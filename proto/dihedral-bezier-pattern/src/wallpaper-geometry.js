/**
 * 壁紙群の基本領域と、対称性の要素（回転中心・鏡・すべり鏡）のジオメトリ。
 *
 * ## 基本領域の作り方
 *
 * 17 群それぞれの基本領域を手で書き下すかわりに、ディリクレ領域として計算する。
 * 群のどの変換でも動かない点（回転中心や鏡の上）を避けた「一般の位置」の点 b を
 * ひとつ選ぶと、b の軌道は自由（重なりがない）になる。そのとき
 *
 *   基本領域 = 軌道の中で b がいちばん近い点の集まり（b のボロノイ領域）
 *
 * は、必ず正しい基本領域になる。しかも凸多角形なので、
 *
 * - 面積がちょうど「単位格子 ÷ 変換の数」になり、正しさを数値で検算できる
 * - b から輪郭までの距離（内接円）がとれるので、模様を領域の内側に収めやすい
 * - 17 群を同じコードで扱える（群ごとの場合分けが要らない）
 *
 * b は「丸い基本領域になる位置」を格子内から総当たりで選ぶ。細長い領域だと
 * 模様が置きにくく、群どうしの見比べもしにくいため。
 *
 * ## 座標系
 *
 * 変換は格子座標で定義されている（wallpaper-groups.js）。
 * 基底行列 P = [t1 t2] を使い、Cartesian の変換 x → A·x + c に直してから使う。
 *
 *   A = P · M · P⁻¹     c = P · t
 */

import { wallpaperGroup, LATTICES } from './wallpaper-groups.js'

const EPS = 1e-9

/* --- ベクトルと多角形 --- */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const scale = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1])

export function polygonArea(points) {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/** 凸多角形の内側なら true（頂点は反時計回り・時計回りのどちらでもよい） */
export function polygonContains(points, p, margin = 0) {
  let positive = 0
  let negative = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    const edge = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    if (cross / edge > margin) positive++
    if (cross / edge < -margin) negative++
  }
  return positive === 0 || negative === 0
}

/** 凹んだ多角形でも使える内外判定（交差数） */
export function pathContains(points, [x, y]) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** 半平面 dot(n, x) <= c で多角形を切る（Sutherland-Hodgman） */
function clipHalfPlane(points, n, c) {
  const out = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const da = dot(n, a) - c
    const db = dot(n, b) - c
    if (da <= 0) out.push(a)
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db)
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    }
  }
  return out
}

/** 点 p から見た多角形の内接円の半径（いちばん近い辺までの距離） */
export function inradiusFrom(points, p) {
  let best = Infinity
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const edge = sub(b, a)
    const l = len(edge) || 1
    best = Math.min(best, Math.abs((edge[0] * (p[1] - a[1]) - edge[1] * (p[0] - a[0])) / l))
  }
  return best
}

const circumradiusFrom = (points, p) => Math.max(...points.map((q) => len(sub(q, p))))

/** 中心 c から角度 theta の半直線が、凸多角形の輪郭と交わる点 */
export function rayHit(points, c, theta) {
  const dir = [Math.cos(theta), Math.sin(theta)]
  let best = null
  let bestT = Infinity
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const e = sub(b, a)
    const denominator = dir[0] * e[1] - dir[1] * e[0]
    if (Math.abs(denominator) < EPS) continue
    const diff = sub(a, c)
    const t = (diff[0] * e[1] - diff[1] * e[0]) / denominator
    const s = (diff[0] * dir[1] - diff[1] * dir[0]) / denominator
    if (t > EPS && s >= -EPS && s <= 1 + EPS && t < bestT) {
      bestT = t
      best = add(c, scale(dir, t))
    }
  }
  return best ?? c
}

/**
 * 中心から放射状に切り分けた区画。
 * angles は昇順の角度（0〜2π を一周ぶん）。区画は多角形を過不足なく覆う。
 */
export function sectorPolygons(points, center, angles) {
  const tau = Math.PI * 2
  // 頂点を中心から見た角度の順に並べておく
  const vertices = points
    .map((p) => ({ p, a: Math.atan2(p[1] - center[1], p[0] - center[0]) }))
    .map((v) => ({ ...v, a: (v.a + tau) % tau }))
    .sort((x, y) => x.a - y.a)

  return angles.map((from, i) => {
    const to = i === angles.length - 1 ? angles[0] + tau : angles[i + 1]
    const span = to - from
    const inside = vertices
      .map((v) => ({ ...v, rel: (v.a - from + tau * 2) % tau }))
      .filter((v) => v.rel > EPS && v.rel < span - EPS)
      .sort((x, y) => x.rel - y.rel)
    const ring = [
      center,
      rayHit(points, center, from),
      ...inside.map((v) => v.p),
      rayHit(points, center, to),
    ]
    // 区画の境目が頂点にちょうど当たると同じ点が続くので、詰めておく
    return ring.filter((p, i) => i === 0 || len(sub(p, ring[i - 1])) > EPS)
  })
}

/**
 * 重なった頂点と、一直線上に並んだ頂点を落とす。
 *
 * ディリクレ領域は半平面で切って作るので、長さが 1e-14 のような辺が残ることがある。
 * 見た目には出ないが、頂点まわりの内角や辺の長さを使うときは 0 除算になりうるので、
 * そういう用途では先にこれで均しておく。
 */
export function simplifyPolygon(points, tolerance) {
  const distinct = points.filter((p, i) => len(sub(p, points[(i + 1) % points.length])) > tolerance)
  if (distinct.length < 3) return points
  return distinct.filter((p, i) => {
    const a = distinct[(i - 1 + distinct.length) % distinct.length]
    const b = distinct[(i + 1) % distinct.length]
    const e = sub(b, a)
    const l = len(e) || 1
    return Math.abs((e[0] * (p[1] - a[1]) - e[1] * (p[0] - a[0])) / l) > tolerance
  })
}

/** 中心を固定して多角形を相似縮小する */
export const scalePolygon = (points, center, k) =>
  points.map((p) => [center[0] + (p[0] - center[0]) * k, center[1] + (p[1] - center[1]) * k])

/* --- 行列 --- */

const matMul = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
]

const matApply = (A, v) => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]

const matInverse = (A) => {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  return [
    [A[1][1] / det, -A[0][1] / det],
    [-A[1][0] / det, A[0][0] / det],
  ]
}

const applyOp = (op, p) => add(matApply(op.A, p), op.c)

/* --- 基本領域 --- */

/** 変換と格子並進をすべて掛けた、点 p の軌道（p 自身は除く） */
function orbitAround(ops, t1, t2, p, range) {
  const points = []
  for (const op of ops) {
    const image = applyOp(op, p)
    for (let m = -range; m <= range; m++) {
      for (let n = -range; n <= range; n++) {
        const q = [image[0] + m * t1[0] + n * t2[0], image[1] + m * t1[1] + n * t2[1]]
        if (len(sub(q, p)) > EPS) points.push(q)
      }
    }
  }
  return points
}

/** 点 p のボロノイ領域（= 基本領域） */
function dirichletDomain(ops, t1, t2, p, span) {
  let poly = [
    [p[0] - span, p[1] - span],
    [p[0] + span, p[1] - span],
    [p[0] + span, p[1] + span],
    [p[0] - span, p[1] + span],
  ]
  for (const q of orbitAround(ops, t1, t2, p, 3)) {
    // p と q の垂直二等分線で切り、p の側だけを残す
    const n = sub(q, p)
    const c = (dot(q, q) - dot(p, p)) / 2
    poly = clipHalfPlane(poly, n, c)
    if (poly.length < 3) return null
  }
  return poly
}

/**
 * 基本領域の中心にする点を選ぶ。
 * どの変換でも動かない点（回転中心・鏡の上）は軌道が重なって基本領域にならないので避け、
 * 残りの候補から「いちばん丸い」ものを採る。
 */
function chooseBase(ops, t1, t2, span, expectedArea) {
  const steps = 16
  let best = null

  for (let i = 1; i < steps; i++) {
    for (let j = 1; j < steps; j++) {
      const u = i / steps
      const v = j / steps
      const p = [u * t1[0] + v * t2[0], u * t1[1] + v * t2[1]]

      // 対称性の要素の上に乗っている点は使えない
      const nearest = Math.min(...orbitAround(ops, t1, t2, p, 1).map((q) => len(sub(q, p))))
      if (nearest < span * 0.02) continue

      const poly = dirichletDomain(ops, t1, t2, p, span)
      if (!poly) continue
      if (Math.abs(polygonArea(poly) - expectedArea) > expectedArea * 1e-6) continue

      // 内接円と外接円の比が 1 に近いほど丸い
      const roundness = inradiusFrom(poly, p) / circumradiusFrom(poly, p)
      if (!best || roundness > best.roundness) best = { p, poly, roundness }
    }
  }

  if (!best) throw new Error('基本領域を作れなかった')
  return best
}

/**
 * 壁紙群 1 つぶんのジオメトリを作る。
 * domainArea は基本領域の面積で、これを群どうしでそろえると
 * モチーフが同じ大きさで現れ、対称性の違いだけを見比べられる。
 */
export function createWallpaperDomain({ group, domainArea }) {
  const { name, lattice, centered, pointGroup, ops } = wallpaperGroup(group)

  // 単位格子の面積が「基本領域 × 変換の数」になるよう、格子の大きさを決める
  const [b1, b2] = LATTICES[lattice]
  const unitArea = Math.abs(b1[0] * b2[1] - b1[1] * b2[0])
  const k = Math.sqrt((domainArea * ops.length) / unitArea)
  const t1 = scale(b1, k)
  const t2 = scale(b2, k)

  // 格子座標の変換を Cartesian の x → A·x + c に直す
  const P = [
    [t1[0], t2[0]],
    [t1[1], t2[1]],
  ]
  const Pinv = matInverse(P)
  const cartesian = ops.map((op) => ({
    A: matMul(matMul(P, op.M), Pinv),
    c: matApply(P, op.t),
  }))

  const cellArea = unitArea * k * k
  const span = (len(t1) + len(t2)) * 2
  const { p: base, poly: domain } = chooseBase(cartesian, t1, t2, span, cellArea / ops.length)

  return {
    name,
    lattice,
    centered,
    pointGroup,
    ops: cartesian,
    t1,
    t2,
    cellArea,
    base,
    domain,
    inradius: inradiusFrom(domain, base),
    circumradius: circumradiusFrom(domain, base),
  }
}

/* --- 対称性の要素（ガイド用） --- */

/** 行列が何回回転にあたるか（1, 2, 3, 4, 6 のいずれか） */
function rotationOrder(A) {
  let M = A
  for (let k = 1; k <= 6; k++) {
    if (Math.abs(M[0][0] - 1) < 1e-6 && Math.abs(M[1][1] - 1) < 1e-6 &&
        Math.abs(M[0][1]) < 1e-6 && Math.abs(M[1][0]) < 1e-6) return k
    M = matMul(M, A)
  }
  return 1
}

const determinant = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0]

/**
 * 描画範囲に現れる回転中心・鏡・すべり鏡を集める。
 * 変換に格子並進を足したものも合成の相手にする（並進のぶんだけ要素が増えるため）。
 */
export function symmetryElements(domain, range) {
  const { ops, t1, t2 } = domain
  const centers = new Map()
  const axes = new Map()

  for (const op of ops) {
    for (let m = -range; m <= range; m++) {
      for (let n = -range; n <= range; n++) {
        const c = [
          op.c[0] + m * t1[0] + n * t2[0],
          op.c[1] + m * t1[1] + n * t2[1],
        ]

        if (determinant(op.A) > 0) {
          const order = rotationOrder(op.A)
          if (order === 1) continue
          // x = A·x + c の不動点
          const N = [
            [1 - op.A[0][0], -op.A[0][1]],
            [-op.A[1][0], 1 - op.A[1][1]],
          ]
          const fixed = matApply(matInverse(N), c)
          const key = `${Math.round(fixed[0] * 100)},${Math.round(fixed[1] * 100)}`
          const previous = centers.get(key)
          if (!previous || previous.order < order) centers.set(key, { at: fixed, order })
          continue
        }

        // 鏡映：A の固有値 +1 の向きが鏡の方向
        const direction = mirrorDirection(op.A)
        const along = dot(c, direction)
        const across = sub(c, scale(direction, along))
        const through = scale(across, 0.5)
        // 向き（π で同一）と原点からの符号つき距離で軸を識別する
        const normal = [-direction[1], direction[0]]
        const offset = dot(through, normal)
        const angle = ((Math.atan2(direction[1], direction[0]) % Math.PI) + Math.PI) % Math.PI
        const key = `${Math.round(angle * 1e4)}|${Math.round(offset * 100)}`
        const glide = Math.abs(along) > 1e-6
        const previous = axes.get(key)
        // 同じ軸に純粋な鏡とすべりの両方が乗るときは、鏡として扱う
        if (!previous) axes.set(key, { through, direction, glide })
        else if (!glide) previous.glide = false
      }
    }
  }

  return { centers: [...centers.values()], axes: [...axes.values()] }
}

/** 鏡映行列の、鏡の向き（固有値 +1 の固有ベクトル） */
function mirrorDirection(A) {
  // A = [[cos, sin], [sin, -cos]] の形（2θ が鏡の角度の 2 倍）
  const theta = Math.atan2(A[1][0], A[0][0]) / 2
  return [Math.cos(theta), Math.sin(theta)]
}

/** 描画範囲を覆うのに必要な格子並進の (m, n) の範囲 */
export function latticeRange(domain, corners) {
  const { t1, t2 } = domain
  const Pinv = matInverse([
    [t1[0], t2[0]],
    [t1[1], t2[1]],
  ])
  let minM = Infinity
  let maxM = -Infinity
  let minN = Infinity
  let maxN = -Infinity
  for (const corner of corners) {
    const [m, n] = matApply(Pinv, corner)
    minM = Math.min(minM, m)
    maxM = Math.max(maxM, m)
    minN = Math.min(minN, n)
    maxN = Math.max(maxN, n)
  }
  // 基本領域は単位格子の外へはみ出しうるので、2 枚ぶん余分に敷いて縁の欠けを防ぐ
  return {
    fromM: Math.floor(minM) - 2,
    toM: Math.ceil(maxM) + 2,
    fromN: Math.floor(minN) - 2,
    toN: Math.ceil(maxN) + 2,
  }
}
