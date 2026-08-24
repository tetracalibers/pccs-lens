/**
 * カイト＆ダートタイリング（ペンローズ P2）の幾何。
 *
 * タイルは 2 種類だけ。どちらも辺の長さは短辺 1 と長辺 φ の 2 種で、
 * カイト（凧）は内角 72-72-72-144 の凸四角形、ダート（矢じり）は
 * 内角 36-216-36-72 のへこんだ四角形。
 *
 * どちらも軸で 2 つに切ると二等辺三角形（ロビンソン三角形）になる。
 * この半タイルを単位にして、1/φ に縮んだ半タイルへ切り分ける
 * 「分割（deflation）」を繰り返すと、非周期のタイリングが得られる。
 *
 *   半カイト → 半カイト 2 枚 + 半ダート 1 枚
 *   半ダート → 半カイト 1 枚 + 半ダート 1 枚
 *
 * P1（五角形版）の置換と違って、子は必ず親の内側に収まる。かわりに
 * 半ダートは必ず親の長辺をまたいで生まれるので、**ダートは 2 つの親に
 * またがってできる**。描くときは軸の辺で半タイル 2 枚を突き合わせて
 * 1 枚のタイルに戻す。
 */

export const PHI = (1 + Math.sqrt(5)) / 2

const INV_PHI = 1 / PHI

/** 短辺 1 に対するカイトの差し渡し（＝軸の長さ＝長辺の長さ）。タイルの大きさを決めるのに使う */
export const KITE_WIDTH = PHI

/** 種にする正十角形（太陽）の内接円半径。短辺 1 に対する比 */
const SUN_APOTHEM = 0.5 / Math.tan(Math.PI / 10)

/**
 * 色分けに使う「どのタイルから生まれたか」。
 *
 * カイトは親が 1 枚に定まるので、親（と祖父母）の種類で分ける。
 * ダートは 2 つの親にまたがるので、両側の親の種類の組で分ける。
 */
export const TILE_CLASSES = [
  'kiteFromKiteKite', // 親がカイトで、その親もカイト
  'kiteFromKiteDart', // 親がカイトで、その親はダート
  'kiteFromDart', // 親がダート
  'dartBetweenKites', // 両側の親がカイト
  'dartBetweenKiteDart', // 片側がカイトで片側がダート
  'dartBetweenDarts', // 両側の親がダート
]

/* --- 半タイル ---
 *
 * 半タイルは頂点 3 つの並び [p0, p1, p2] で持つ。どちらの型でも
 * p2–p0 が軸（タイルを半分に切った線）で、p0–p1 と p1–p2 がタイルの辺。
 *
 * - 半カイト: p0 = 先端（72°の頂点）、p1 = 横の頂点（72°）、p2 = 広い頂点（144°）
 *   辺の長さは p0–p1 が長辺 φ、p1–p2 が短辺 1、軸 p2–p0 が長辺 φ
 * - 半ダート: p0 = へこんだ頂点（216°）、p1 = とがり（36°）、p2 = 72°の頂点
 *   辺の長さは p0–p1 が短辺 1、p1–p2 が長辺 φ、軸 p2–p0 が短辺 1
 */

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/**
 * 半タイル 1 枚を 1/φ に縮んだ半タイルへ切り分けて out に足す。
 *
 * from には親の種類を、fromFrom には親の親の種類を記録する（色分けに使う）。
 */
function deflateHalf(tile, out) {
  const [p0, p1, p2] = tile.points
  const from = tile.type
  const fromFrom = tile.from

  if (tile.type === 'kite') {
    // 軸上の 1/φ の点と、長辺上の 1/φ² の点で切る。
    // 子のカイト 2 枚は軸 p1–w を突き合わせて 1 枚のカイトになり（親の内側で完結）、
    // 子のダートは親の長辺 p0–p1 をまたぐので、向こう側の半分と組んで 1 枚になる。
    const w = lerp(p0, p2, INV_PHI)
    const z = lerp(p0, p1, INV_PHI * INV_PHI)
    out.push({ type: 'kite', points: [p1, p2, w], from, fromFrom })
    out.push({ type: 'kite', points: [p1, z, w], from, fromFrom })
    out.push({ type: 'dart', points: [z, w, p0], from, fromFrom })
    return
  }

  // 半ダートは長辺 p1–p2 上の点で切る。子のカイトは軸 p0–p2（＝親の軸）を
  // 突き合わせて 1 枚になり、子のダートは親の長辺をまたぐ。
  const v = lerp(p2, p1, INV_PHI)
  out.push({ type: 'kite', points: [p2, v, p0], from, fromFrom })
  out.push({ type: 'dart', points: [v, p0, p1], from, fromFrom })
}

/**
 * 種にする「太陽」（カイト 5 枚が先端を突き合わせた配置）を半タイル 10 枚で作る。
 *
 * カイトの先端は 72 度なので 5 枚でちょうど一周し、外周は 1 辺が短辺の
 * 正十角形になる。分割しても領域は変わらないので、この十角形の内接円が
 * そのまま「隙間なく埋まる範囲」になる。
 */
function sunHalves(unit, baseAngle) {
  const radius = PHI * unit
  const vertex = (k) => {
    const angle = baseAngle + (k * Math.PI) / 5
    return [radius * Math.cos(angle), radius * Math.sin(angle)]
  }

  const halves = []
  for (let k = 0; k < 10; k++) {
    // 広い頂点（カイトの軸の先）は 36 度の奇数倍の向きに来る
    const even = k % 2 === 0
    halves.push({
      type: 'kite',
      points: [[0, 0], vertex(even ? k : k + 1), vertex(even ? k + 1 : k)],
      from: 'kite',
      fromFrom: 'kite',
    })
  }
  return halves
}

/** 半タイルの重心。描画範囲から遠いものを捨てるのに使う */
const centroid = ([a, b, c]) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]

/**
 * 軸の辺を突き合わせて、半タイル 2 枚を 1 枚のタイルに戻す。
 *
 * 軸の両端（p0 と p2）は役割が違うので、組になる 2 枚は同じ点を p0・p2 に持つ。
 * 相方が枝刈りで消えている縁のタイルは、半分のまま返す（描画範囲の外にしかない）。
 */
function mergeHalves(halves, unit) {
  const grid = unit * 1e-3
  const at = ([x, y]) => `${Math.round(x / grid)},${Math.round(y / grid)}`

  const groups = new Map()
  for (const half of halves) {
    const key = `${half.type}:${at(half.points[0])}:${at(half.points[2])}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(half)
  }

  const tiles = []
  for (const group of groups.values()) {
    const [a, b] = group
    const points = b
      ? [a.points[1], a.points[0], b.points[1], a.points[2]]
      : [a.points[0], a.points[1], a.points[2]]
    tiles.push({ type: a.type, cls: classOf(a, b), points })
  }
  return tiles
}

/** タイルの色分けの種別。親（カイトは祖父母まで、ダートは両側の親）で決める */
function classOf(a, b) {
  if (a.type === 'kite') {
    if (a.from === 'dart') return 'kiteFromDart'
    return a.fromFrom === 'dart' ? 'kiteFromKiteDart' : 'kiteFromKiteKite'
  }
  const darts = (a.from === 'dart' ? 1 : 0) + ((b ?? a).from === 'dart' ? 1 : 0)
  if (darts === 0) return 'dartBetweenKites'
  return darts === 1 ? 'dartBetweenKiteDart' : 'dartBetweenDarts'
}

/**
 * カイト＆ダートタイリングを作る。
 *
 * 種は太陽 1 つ。分割のたびに辺の長さが 1/φ ずつ縮むので、描画範囲を覆う
 * 大きさの太陽から始めて、必要な回数だけ分割する。子は親の内側にしか
 * 生まれないので、描画範囲から遠いタイルは各段で捨ててよい。
 *
 * @param unit 最終的なタイルの短辺の長さ
 * @param baseAngle 全体の回転（ラジアン）
 * @param view 描く範囲 { x, y, radius }（タイリングの座標系）
 */
export function buildTiling({ unit, baseAngle = 0, view }) {
  // 太陽の内接円が描画範囲を覆うまで分割を重ねる。縁には相方のいない
  // 半タイルが残るので、タイル 2 枚ぶんの余裕を見ておく
  const reach = Math.hypot(view.x, view.y) + view.radius + 2 * PHI * unit
  const levels = Math.max(1, Math.ceil(Math.log(reach / (SUN_APOTHEM * unit)) / Math.log(PHI)))

  let currentUnit = unit * PHI ** levels
  let halves = sunHalves(currentUnit, baseAngle)

  for (let level = 0; level < levels; level++) {
    const next = []
    for (const half of halves) deflateHalf(half, next)
    currentUnit *= INV_PHI
    // 子は親の内側にしか生まれないので、外へ出たタイルは以後も戻ってこない。
    // 相方を残すために、タイルの差し渡し 2 枚ぶんを余裕として足す
    const margin = view.radius + 2 * PHI * currentUnit
    halves = next.filter((half) => {
      const [cx, cy] = centroid(half.points)
      return Math.hypot(cx - view.x, cy - view.y) < margin
    })
  }

  return { tiles: mergeHalves(halves, currentUnit), unit: currentUnit }
}

/** 多角形の面積（へこんだダートでも符号付き面積の絶対値で正しく出る） */
export function polygonArea(points) {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}
