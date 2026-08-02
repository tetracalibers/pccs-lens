/**
 * 二面体群 D_n の基本領域と、その上に描くベジェ曲線のジオメトリ。
 *
 * 座標系は模様の中心を原点にとる。角度 θ は x 軸正方向から測り、
 * 基本領域は θ ∈ [0, α]（α = π/n）の楔形。
 * θ=0 と θ=α の 2 本の半直線が鏡映線で、この 2 枚の鏡が D_n を生成する。
 */

export const v = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  scale: (a, k) => [a[0] * k, a[1] * k],
  len: (a) => Math.hypot(a[0], a[1]),
  norm: (a) => {
    const l = Math.hypot(a[0], a[1]) || 1
    return [a[0] / l, a[1] / l]
  },
}

const num = (x) => String(Math.round(x * 100) / 100)

/** 点を SVG パスの座標に整形する */
export const p = ([x, y]) => `${num(x)},${num(y)}`

/**
 * 基本領域を作る。
 *
 * shape: 'polygon' … 正 n 角形（基本領域は中心・辺の中点・頂点が作る直角三角形）
 *        'circle'  … 円（基本領域は中心角 α の扇形）
 *
 * radius は正 n 角形の外接円半径（= 頂点までの距離）。
 */
export function createDomain({ n, radius, shape = 'polygon' }) {
  const alpha = Math.PI / n
  // アポテム（内接円半径）。θ=0 方向が辺の中点、θ=α 方向が頂点になる
  const apothem = shape === 'polygon' ? radius * Math.cos(alpha) : radius

  /** 角度 θ における基本領域の外周までの距離 */
  const maxRadiusAt = (theta) =>
    shape === 'polygon' ? apothem / Math.cos(theta) : radius

  /** level は外周までの距離に対する比率（0 = 中心, 1 = 外周） */
  const pointAt = (level, theta) => {
    const r = level * maxRadiusAt(theta)
    return [r * Math.cos(theta), r * Math.sin(theta)]
  }

  /** θ=α の鏡映線に直交し、領域の内側を向く単位ベクトル */
  const innerNormal = [Math.sin(alpha), -Math.cos(alpha)]

  /** ある点から基本領域の境界までの余裕（内接円の半径の上限） */
  const clearance = ([x, y]) => {
    const toMirror0 = Math.abs(y)
    const toMirror1 = Math.abs(x * Math.sin(alpha) - y * Math.cos(alpha))
    const toOuter =
      shape === 'polygon' ? apothem - x : radius - Math.hypot(x, y)
    return Math.max(0, Math.min(toMirror0, toMirror1, toOuter))
  }

  /** D_n の 2n 個の合同変換（SVG の transform 属性値） */
  const transforms = []
  for (let k = 0; k < n; k++) {
    const deg = Math.round(((360 / n) * k * 1000)) / 1000
    transforms.push(`rotate(${deg})`)
    // 鏡映してから回転（θ=0 の鏡で折り返した楔を各方向へ配置する）
    transforms.push(`rotate(${deg}) scale(1,-1)`)
  }

  return {
    n,
    alpha,
    radius,
    apothem,
    shape,
    maxRadiusAt,
    pointAt,
    innerNormal,
    clearance,
    transforms,
  }
}

/**
 * 基本領域を θ=0 の鏡映線から θ=α の鏡映線まで横断する曲線。
 *
 * wobbles の長さぶんだけ θ をサンプリングし、level を揺らした点を
 * Catmull-Rom 的な接線で 3 次ベジェにつなぐ。
 * 両端の接線は鏡映線に直交させるので、コピーどうしが端点で滑らかに接続し、
 * 全体として 1 本の波打つ環になる。
 */
export function levelCurve(domain, level, wobbles) {
  const { alpha, pointAt, innerNormal } = domain
  const last = wobbles.length - 1

  const points = wobbles.map((w, i) =>
    pointAt(Math.max(level * (1 + w), 0.001), (alpha * i) / last),
  )

  const tangents = points.map((_, i) => {
    if (i === 0) {
      // θ=0 の鏡（x 軸）に直交する向き
      return [0, v.len(v.sub(points[1], points[0]))]
    }
    if (i === last) {
      // θ=α の鏡に直交し、θ が増える向き
      const l = v.len(v.sub(points[last], points[last - 1]))
      return v.scale([-innerNormal[0], -innerNormal[1]], l)
    }
    return v.scale(v.sub(points[i + 1], points[i - 1]), 0.5)
  })

  const segments = []
  for (let i = 0; i < last; i++) {
    segments.push({
      c1: v.add(points[i], v.scale(tangents[i], 1 / 3)),
      c2: v.sub(points[i + 1], v.scale(tangents[i + 1], 1 / 3)),
      end: points[i + 1],
    })
  }

  return { start: points[0], end: points[last], segments }
}

export function curveForward(curve) {
  return curve.segments
    .map((s) => `C${p(s.c1)} ${p(s.c2)} ${p(s.end)}`)
    .join('')
}

export function curveBackward(curve) {
  const out = []
  for (let i = curve.segments.length - 1; i >= 0; i--) {
    const s = curve.segments[i]
    const end = i === 0 ? curve.start : curve.segments[i - 1].end
    out.push(`C${p(s.c2)} ${p(s.c1)} ${p(end)}`)
  }
  return out.join('')
}

export function curvePath(curve) {
  return `M${p(curve.start)}${curveForward(curve)}`
}

/**
 * 2 本のレベル曲線に挟まれた帯。
 * 鏡映線に重なる直線部分は、コピーと貼り合わせると内部に消える。
 * inner が null のときは中心までの扇形になる。
 */
export function bandPath(inner, outer) {
  if (!inner) {
    return `M0,0L${p(outer.start)}${curveForward(outer)}L0,0Z`
  }
  return (
    `M${p(inner.start)}L${p(outer.start)}${curveForward(outer)}` +
    `L${p(inner.end)}${curveBackward(inner)}Z`
  )
}

/** 閉じた Catmull-Rom スプライン（ブロブ用） */
export function closedSpline(points) {
  const N = points.length
  const tangents = points.map((_, i) =>
    v.scale(v.sub(points[(i + 1) % N], points[(i - 1 + N) % N]), 0.5),
  )
  let d = `M${p(points[0])}`
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N
    d +=
      `C${p(v.add(points[i], v.scale(tangents[i], 1 / 3)))} ` +
      `${p(v.sub(points[j], v.scale(tangents[j], 1 / 3)))} ${p(points[j])}`
  }
  return `${d}Z`
}
