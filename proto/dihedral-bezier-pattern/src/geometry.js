/**
 * 二面体群 D_n の基本領域と、その上に描く輪郭のジオメトリ。
 *
 * 座標系は模様の中心を原点にとる。角度 θ は x 軸正方向から測り、
 * 基本領域は θ ∈ [0, α]（α = π/n）の楔形。
 * θ=0 と θ=α の 2 本の半直線が鏡映線で、この 2 枚の鏡が D_n を生成する。
 *
 * 基本領域を横断する輪郭は、曲線版（levelCurve）と直線版（levelPolyline）の
 * どちらも `{ start, end, segments }` という同じ形で返す。
 * segments の要素に制御点 c1・c2 があれば 3 次ベジェ、無ければ直線として書き出す。
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
    const deg = Math.round((360 / n) * k * 1000) / 1000
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
 * 基本領域を θ=0 の鏡映線から θ=α の鏡映線まで横断するベジェ曲線。
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

/**
 * levelCurve の直線版。基本領域を横断する折れ線を作る。
 *
 * step が false ならサンプル点どうしを直接つないだジグザグ、
 * true なら「level を保ったまま θ を進めてから半径方向へ動く」階段状になる。
 * polygon 形状では level 一定の経路が正 n 角形の辺（直線）そのものなので、
 * 階段の踏み面も直線で表せる。
 */
export function levelPolyline(domain, level, wobbles, { step = false } = {}) {
  const { alpha, pointAt } = domain
  const last = wobbles.length - 1

  const levels = wobbles.map((w) => Math.max(level * (1 + w), 0.001))
  const thetas = wobbles.map((_, i) => (alpha * i) / last)

  // 階段状のとき、最後の段差（半径方向の move）は θ=α の鏡映線にちょうど重なる。
  // そのままだと帯が幅ゼロの針として鏡映線の外へ突き出し、塗りには出ないのに
  // 継ぎ目埋めのヘアラインだけが線として見えてしまうので、段差を潰しておく。
  if (step) levels[last] = levels[last - 1]

  const segments = []
  for (let i = 1; i <= last; i++) {
    if (step) segments.push({ end: pointAt(levels[i - 1], thetas[i]) })
    if (!step || levels[i] !== levels[i - 1]) {
      segments.push({ end: pointAt(levels[i], thetas[i]) })
    }
  }

  return {
    start: pointAt(levels[0], thetas[0]),
    end: pointAt(levels[last], thetas[last]),
    segments,
  }
}

const segmentTo = (s) =>
  s.c1 ? `C${p(s.c1)} ${p(s.c2)} ${p(s.end)}` : `L${p(s.end)}`

const segmentBack = (s, end) =>
  s.c1 ? `C${p(s.c2)} ${p(s.c1)} ${p(end)}` : `L${p(end)}`

export function boundaryForward(boundary) {
  return boundary.segments.map(segmentTo).join('')
}

export function boundaryBackward(boundary) {
  const out = []
  for (let i = boundary.segments.length - 1; i >= 0; i--) {
    const end = i === 0 ? boundary.start : boundary.segments[i - 1].end
    out.push(segmentBack(boundary.segments[i], end))
  }
  return out.join('')
}

/** 輪郭 1 本ぶんの開いたパス（ストローク用） */
export function boundaryPath(boundary) {
  return `M${p(boundary.start)}${boundaryForward(boundary)}`
}

/**
 * 2 本の輪郭に挟まれた帯。
 * 鏡映線に重なる直線部分は、コピーと貼り合わせると内部に消える。
 * inner が null のときは中心までの扇形になる。
 */
export function bandPath(inner, outer) {
  if (!inner) {
    return `M0,0L${p(outer.start)}${boundaryForward(outer)}L0,0Z`
  }
  return (
    `M${p(inner.start)}L${p(outer.start)}${boundaryForward(outer)}` +
    `L${p(inner.end)}${boundaryBackward(inner)}Z`
  )
}

/** 閉じた Catmull-Rom スプライン（曲線版のブロブ用） */
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

/** 閉じた多角形（直線版のブロブ・破片用） */
export function polygonPath(points) {
  return `M${points.map(p).join('L')}Z`
}

/** 原点を中心とする正多角形 */
export function regularPolygonPath(sides, radius, rotation = 0) {
  const points = Array.from({ length: sides }, (_, i) => {
    const a = rotation + (Math.PI * 2 * i) / sides
    return [radius * Math.cos(a), radius * Math.sin(a)]
  })
  return polygonPath(points)
}
