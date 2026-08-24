/**
 * 準結晶版の幾何。
 *
 * タイリング自体はカイト＆ダート版（`kite-dart-geometry.js`）のものをそのまま使い、
 * ここでは「結晶らしさ」を取り出すための計算だけを持つ。
 *
 * - **向き（orientation）** — タイルの軸はすべて 36 度の倍数を向く。0〜9 の整数で持つ
 * - **頂点ネットワーク** — タイルの面ではなく、頂点と辺の側から見たタイリング
 * - **劈開線** — 頂点が乗る平行線の族。5 方向あり、間隔は φ : 1 の 2 種類になる
 * - **成長** — 中心からの距離で「結晶面 / 半透明面 / 線 / 何も無し」を切り替える
 * - **多結晶** — 結晶核を複数置き、いちばん近い核の領域（ボロノイ領域）で分ける
 */

import { PHI } from './kite-dart-geometry.js'

/** 36 度。タイルの軸も辺も、すべてこの倍数を向く */
export const STEP = Math.PI / 5

const TAU = Math.PI * 2

/* --- タイルの向き --- */

/**
 * タイルの軸（半タイルに切った線）の両端。
 * 突き合わせ済みのタイルは `[p1a, p0, p1b, p2]` の並びなので p0 → p2、
 * 相方が見つからなかった半タイルは `[p0, p1, p2]` なので p0 → p2。
 */
export function tileAxis(tile) {
  const p = tile.points
  return p.length === 4 ? [p[1], p[3]] : [p[0], p[2]]
}

/** タイルの軸の向きを 36 度刻みの整数（0〜9）で返す */
export function orientationOf(tile, baseAngle) {
  const [a, b] = tileAxis(tile)
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) - baseAngle
  return ((Math.round(angle / STEP) % 10) + 10) % 10
}

/** 頂点の平均。ダートはへこんでいるので内部の点にはならないが、距離の判定には足りる */
export function tileCenter(tile) {
  const n = tile.points.length
  const x = tile.points.reduce((sum, p) => sum + p[0], 0) / n
  const y = tile.points.reduce((sum, p) => sum + p[1], 0) / n
  return [x, y]
}

/** タイルの辺（軸は辺ではないので、半タイルのときは 2 本しか無い） */
export function tileEdges(tile) {
  const p = tile.points
  if (p.length === 3) {
    return [
      [p[0], p[1]],
      [p[1], p[2]],
    ]
  }
  return p.map((point, i) => [point, p[(i + 1) % p.length]])
}

/* --- 頂点ネットワーク --- */

/** 同じ点を同じ文字列に落とす（誤差を丸めて突き合わせる） */
const keyer = (grid) => ([x, y]) => `${Math.round(x / grid)},${Math.round(y / grid)}`

/**
 * タイルの集まりを、頂点と辺の側から見直す。
 *
 * 頂点には集まるタイルの内訳（カイト何枚・ダート何枚）も持たせる。カイト＆ダート
 * タイリングの頂点は 7 種類しかなく、**カイト 5 枚（太陽）とダート 5 枚（星）**は
 * その中で唯一 5 回対称になる。この 2 つを結晶格子の節点として強調できる。
 *
 * @returns vertices `{ point, valence, kites, darts }`（valence = 集まるタイルの角の数）と、
 *          重複を除いた辺 `{ a, b }`
 */
export function buildNetwork(tiles, unit) {
  const at = keyer(unit * 1e-3)

  const vertices = new Map()
  const touch = (point, type) => {
    const key = at(point)
    const found = vertices.get(key) ?? { point, valence: 0, kites: 0, darts: 0 }
    found.valence++
    if (type === 'kite') found.kites++
    else found.darts++
    vertices.set(key, found)
  }

  const edges = new Map()
  for (const tile of tiles) {
    for (const point of tile.points) touch(point, tile.type)
    for (const [a, b] of tileEdges(tile)) {
      const ka = at(a)
      const kb = at(b)
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
      if (!edges.has(key)) edges.set(key, { a, b })
    }
  }

  return { vertices: [...vertices.values()], edges: [...edges.values()] }
}

/* --- 劈開線 --- */

/**
 * 頂点が乗る平行線の族を取り出す。
 *
 * カイト＆ダートタイリングの頂点は、36 度ずつずれた 5 つの方向それぞれについて、
 * 平行な直線の上にきれいに乗る。間隔はほとんどが L と L/φ の 2 種類で、並びは
 * フィボナッチ列になる（Ammann bar と同じ性質）。まれに L + L/φ の広い間隔が混じる
 * ——そこには頂点がほとんど乗らないので、この方法では取れない。
 *
 * **Ammann bar そのものではない。** あちらはタイルの内側を通る補助線で、頂点は
 * 通らない。ただしタイルの装飾として自前で決めると正しさを検算できないので、
 * ここでは**タイリング自身から誤差なく取り出せる**この線族を劈開線として使う。
 *
 * 法線の向きは baseAngle + 18 度 + 36 度 × k。この向きだと間隔が 2 種類だけになる
 * （36 度の倍数の向きに取ると 5 種類に割れて、線が細かくなりすぎる）。
 *
 * @param minVotes 1 本の線と認めるのに必要な頂点の数。数個しか乗らない線は族から外れた
 *                 例外なので落とす
 * @param inflate 線族を粗くする回数。1 回ごとに間隔が φ 倍になる（`inflateLines`）
 */
export function cleaveLines({ vertices, baseAngle, unit, minVotes = 3, inflate = 0 }) {
  const tol = unit * 1e-3
  const lines = []

  for (let k = 0; k < 5; k++) {
    const angle = baseAngle + STEP / 2 + k * STEP
    const nx = Math.cos(angle)
    const ny = Math.sin(angle)

    const projected = vertices
      .map((v) => v.point[0] * nx + v.point[1] * ny)
      .sort((a, b) => a - b)

    const clusters = []
    for (const value of projected) {
      const last = clusters.at(-1)
      if (last && Math.abs(value - last.offset) < tol) {
        last.votes++
        continue
      }
      clusters.push({ offset: value, votes: 1 })
    }

    const kept = inflateLines(
      clusters.filter((c) => c.votes >= minVotes),
      inflate,
    )
    const strongest = kept.reduce((max, c) => Math.max(max, c.votes), 1)
    for (const c of kept) {
      lines.push({ nx, ny, offset: c.offset, family: k, strength: c.votes / strongest })
    }
  }

  return lines
}

/**
 * 線族を φ 倍ずつ粗くする（フィボナッチ列の逆変換）。
 *
 * 頂点が乗る線はタイルの短辺の 1/3 ほどの間隔で並ぶので、そのままでは劈開線として
 * 密すぎる。間隔の並び `L S L L S L …` は「L → LS、S → L」で伸びるフィボナッチ列
 * なので、**短いほうの間隔を始める線を落とす**と、間隔が L+S と L の 2 種類に戻る
 * ——つまり φ 倍に引き伸ばした同じ形の列になる。これを繰り返す。
 *
 * 頂点が乗らずに取れなかった線があると、そこだけ間隔の並びが崩れる。その位置では
 * 線を落とさずに残すので、粗くしすぎない限り並びは保たれる。
 */
export function inflateLines(lines, rounds) {
  let current = [...lines].sort((a, b) => a.offset - b.offset)

  for (let round = 0; round < rounds && current.length > 2; round++) {
    const gaps = current.slice(1).map((line, i) => line.offset - current[i].offset)
    const shortest = commonShortestGap(gaps)
    if (shortest === null) break // 間隔が 1 種類しか無ければ、これ以上は粗くできない
    const threshold = (shortest * (1 + PHI)) / 2
    current = current.filter((_, i) => !(i < gaps.length && gaps[i] < threshold))
  }

  return current
}

/** 間隔のうち「よく出てくる最小の値」。まれな例外の間隔に引きずられないようにする */
function commonShortestGap(gaps) {
  if (gaps.length < 4) return null
  const quantum = Math.max(...gaps) * 1e-3
  const counts = new Map()
  for (const gap of gaps) {
    const key = Math.round(gap / quantum)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const common = [...counts.entries()]
    .filter(([, n]) => n >= Math.max(2, gaps.length * 0.08))
    .map(([key]) => key)
  if (common.length < 2) return null
  return Math.min(...common) * quantum
}

/**
 * 直線 `p·n = offset` を、半平面 `a·p ≤ b` の共通部分で切って線分にする。
 * 共通部分に入らなければ null。
 */
export function clipLine(line, halfPlanes) {
  const { nx, ny, offset } = line
  const p0 = [nx * offset, ny * offset]
  const dir = [-ny, nx]

  let tMin = -Infinity
  let tMax = Infinity
  for (const { a, b } of halfPlanes) {
    const denom = a[0] * dir[0] + a[1] * dir[1]
    const slack = b - (a[0] * p0[0] + a[1] * p0[1])
    if (Math.abs(denom) < 1e-12) {
      // 平行。境界そのものに重なる線（粒界）を落とさないよう、僅かな誤差は許す
      if (slack < -1e-6) return null
      continue
    }
    const t = slack / denom
    if (denom > 0) tMax = Math.min(tMax, t)
    else tMin = Math.max(tMin, t)
  }
  if (!(tMin < tMax)) return null

  return [
    [p0[0] + dir[0] * tMin, p0[1] + dir[1] * tMin],
    [p0[0] + dir[0] * tMax, p0[1] + dir[1] * tMax],
  ]
}

/** 線分を円の内側で切る。結晶がまだ伸びていない外側へ線を出さないために使う */
export function clipSegmentToDisc([a, b], center, radius) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const fx = a[0] - center[0]
  const fy = a[1] - center[1]
  const qa = dx * dx + dy * dy
  if (qa < 1e-12) return null
  const qb = 2 * (fx * dx + fy * dy)
  const qc = fx * fx + fy * fy - radius * radius
  const disc = qb * qb - 4 * qa * qc
  if (disc <= 0) return null

  const root = Math.sqrt(disc)
  const t0 = Math.max(0, (-qb - root) / (2 * qa))
  const t1 = Math.min(1, (-qb + root) / (2 * qa))
  if (!(t0 < t1)) return null

  return [
    [a[0] + dx * t0, a[1] + dy * t0],
    [a[0] + dx * t1, a[1] + dy * t1],
  ]
}

/** 画面（原点中心の正方形）の半平面 */
export function viewportHalfPlanes(half) {
  return [
    { a: [1, 0], b: half },
    { a: [-1, 0], b: half },
    { a: [0, 1], b: half },
    { a: [0, -1], b: half },
  ]
}

/* --- 成長 --- */

/**
 * 位置から決まる 0〜1 の揺らぎ。結晶化の境目をきれいな円にしないために使う。
 * seed 付き乱数ではなく位置の関数にするのは、同じ場所が常に同じ値になるようにするため。
 */
export function positionNoise([x, y], unit) {
  const h = Math.sin((x / unit) * 12.9898 + (y / unit) * 78.233) * 43758.5453
  return h - Math.floor(h)
}

/**
 * 結晶化の度合い。1 = 結晶面、0 = まだ何も無い。
 *
 * 境目にはタイル数枚ぶんの帯を作り、その中で 透明 → 線 → 半透明面 → 結晶面 と変える。
 */
export function crystallinity(distance, radius, band) {
  if (band <= 0) return distance <= radius ? 1 : 0
  const t = (radius - distance) / band
  return Math.max(0, Math.min(1, t))
}

/** 結晶化の度合いを描き方の段階に落とす */
export function stageOf(value) {
  if (value <= 0) return 0 // 描かない
  if (value < 0.34) return 1 // 線だけ
  if (value < 0.67) return 2 // 半透明の面
  return 3 // 結晶面
}

/* --- 多結晶 --- */

/**
 * 結晶核を置く。核どうしが近すぎると粒がつぶれるので、最小距離を守って選び直す。
 * 核ごとに向きを変える（回転は 72 度ぶん振れば見え方を尽くせる）。
 */
export function buildNuclei({ count, rng, size }) {
  if (count === 1) return [{ center: [0, 0], angle: rng.float(0, TAU / 5) }]

  const spread = size * 0.62
  const minGap = (size / Math.sqrt(count)) * 0.55
  const nuclei = []
  for (let i = 0; i < count; i++) {
    let placed = null
    for (let attempt = 0; attempt < 60; attempt++) {
      const candidate = [rng.float(-spread, spread), rng.float(-spread, spread)]
      const ok = nuclei.every(
        (n) => Math.hypot(candidate[0] - n.center[0], candidate[1] - n.center[1]) > minGap,
      )
      if (ok || attempt === 59) {
        placed = candidate
        break
      }
    }
    nuclei.push({ center: placed, angle: rng.float(0, TAU / 5) })
  }
  return nuclei
}

/**
 * いちばん近い核と、その粒の境界までの距離。
 * 境界は 2 つの核の垂直二等分線なので、距離は平方の差から誤差なく出る。
 */
export function assignGrain(point, nuclei) {
  if (nuclei.length === 1) return { index: 0, margin: Infinity }

  let best = 0
  let bestSq = Infinity
  nuclei.forEach((n, i) => {
    const d = (point[0] - n.center[0]) ** 2 + (point[1] - n.center[1]) ** 2
    if (d < bestSq) {
      bestSq = d
      best = i
    }
  })

  let margin = Infinity
  nuclei.forEach((n, i) => {
    if (i === best) return
    const a = nuclei[best].center
    const b = n.center
    const gap = Math.hypot(b[0] - a[0], b[1] - a[1])
    const dSq = (point[0] - b[0]) ** 2 + (point[1] - b[1]) ** 2
    margin = Math.min(margin, (dSq - bestSq) / (2 * gap))
  })

  return { index: best, margin }
}

/** ある粒の領域を表す半平面（となりの核との垂直二等分線） */
export function grainHalfPlanes(nuclei, index) {
  const a = nuclei[index].center
  return nuclei
    .filter((_, i) => i !== index)
    .map((n) => {
      const b = n.center
      const axis = [b[0] - a[0], b[1] - a[1]]
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      return { a: axis, b: axis[0] * mid[0] + axis[1] * mid[1] }
    })
}

/**
 * 凸領域（半平面の共通部分）で多角形を切る（Sutherland–Hodgman）。
 *
 * 粒界でタイルを切るのに使う。重心で「どちらの粒のものか」を決めて捨てるやり方だと、
 * 境目に隙間が空く——となりの粒は別のタイリングなので、その穴を埋められない。
 * **両方の粒がそれぞれ自分の側だけを描く**ようにすれば、境目は 1 本の直線になり、
 * 隙間も重なりも出ない（岩石の研磨面のように、タイルが切り口で切れる）。
 *
 * へこんだダートを切ると、切り口に幅ゼロの細片が付くことがある。凸領域で切る限り
 * 見た目には出ないが、面積がほぼ 0 の結果は呼び出し側で落とす。
 */
export function clipPolygon(points, halfPlanes) {
  let current = points
  for (const { a, b } of halfPlanes) {
    if (current.length === 0) return []
    const depth = (p) => b - (a[0] * p[0] + a[1] * p[1]) // 0 以上なら内側
    const next = []
    for (let i = 0; i < current.length; i++) {
      const p = current[i]
      const q = current[(i + 1) % current.length]
      const dp = depth(p)
      const dq = depth(q)
      if (dp >= 0) next.push(p)
      if (dp >= 0 !== dq >= 0) {
        const t = dp / (dp - dq)
        next.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
      }
    }
    current = next
  }
  return current
}

/** タイルを別の場所へ平行移動する（核ごとのタイリングを画面の座標へ移すのに使う） */
export function translateTiles(tiles, [dx, dy]) {
  return tiles.map((tile) => ({
    ...tile,
    points: tile.points.map(([x, y]) => [x + dx, y + dy]),
  }))
}

export { PHI }
