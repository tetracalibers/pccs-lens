/**
 * 五角形ペンローズタイリング（P1）の幾何。
 *
 * タイルは正五角形・星（五芒星）・舟・菱形の 4 種で、すべて辺の長さが等しい。
 * 各タイルを 1/φ² に縮めた同じ 4 種で置き換える「置換規則」を繰り返して作る。
 *
 * 置換で生まれるタイルは親の輪郭からはみ出す。はみ出した先では隣のタイルが
 * 同じタイルを生むので、重複を落とせば平面がぴったり埋まる（隙間も重なりも出ない）。
 *
 * 向きは 36 度を 1 とする整数で持つ。タイルの向きはすべて 36 度の倍数なので、
 * 整数にしておくと「五角形の向きは 2 種類あって隣どうしでは必ず違う」といった
 * 判定が誤差なくできる。
 */

export const PHI = (1 + Math.sqrt(5)) / 2

/** 置換 1 回で辺の長さがこの比率に縮む */
const SHRINK = 1 / (PHI * PHI)

/** 向きの目盛り 1 つぶん（36 度） */
const STEP = Math.PI / 5

/* --- 辺の長さ 1 に対する寸法 --- */

/** 正五角形の外接円半径 0.850651 */
const PENT_OUT = 0.5 / Math.sin(Math.PI / 5)
/** 正五角形の内接円半径（中心から辺の中点まで）0.688191 */
const PENT_IN = 0.5 / Math.tan(Math.PI / 5)
/** 星の内側の頂点（へこみ）までの距離 0.525731 */
const STAR_IN = PENT_OUT / PHI
/** 星の外側の頂点（とがり）までの距離 1.376382 */
const STAR_OUT = PENT_IN / PHI + Math.cos(Math.PI / 10)
/** 菱形の長い対角線の半分 0.951057 */
const RHOMB_LONG = Math.cos(Math.PI / 10)
/** 菱形の短い対角線の半分 0.309017 */
const RHOMB_SHORT = Math.sin(Math.PI / 10)

/** 置換で生まれるタイルが親の位置から届く距離（親の辺の長さに対する比） */
const REACH = STAR_OUT / (1 - SHRINK)

/** 五角形の差し渡し（外接円の直径）と辺の長さの比。タイルの大きさを決めるのに使う */
export const PENTAGON_WIDTH = 2 * PENT_OUT

/** 色分けに使う「どの規則のどの位置から生まれたか」 */
export const TILE_ROLES = [
  'pentagonCenter', // 五角形の中心にできる五角形
  'pentagonRing', // 五角形の頂点側にできる五角形
  'pentagonGap', // 星・舟・菱形の中にできる五角形
  'star',
  'boat',
  'diamond',
]

/* --- タイルの輪郭 --- */

const at = (x, y, r, angle) => [x + r * Math.cos(angle), y + r * Math.sin(angle)]

/**
 * タイルの輪郭。angleOf は向きの目盛りを角度（ラジアン）に直す関数。
 *
 * - 五角形: a は辺の中点の向き
 * - 星: a はとがりの向き
 * - 舟: a は真ん中のとがりの向き（星のとがり 5 つのうち 3 つぶんの形）
 * - 菱形: a は「矢印」の向き。長い対角線に沿った 2 方向のうち、
 *   置換したとき五角形が寄る側を指す
 */
export function tileShape(tile, side, angleOf) {
  const { type, x, y, a } = tile
  const dir = (k) => angleOf(a + k)

  if (type === 'pentagon') {
    return [1, 3, 5, 7, 9].map((k) => at(x, y, PENT_OUT * side, dir(k)))
  }

  if (type === 'star') {
    const points = []
    for (let k = 0; k < 10; k += 2) {
      points.push(at(x, y, STAR_OUT * side, dir(k)))
      points.push(at(x, y, STAR_IN * side, dir(k + 1)))
    }
    return points
  }

  if (type === 'boat') {
    const points = [at(x, y, STAR_IN * side, dir(-3))]
    for (const k of [-2, 0, 2]) {
      points.push(at(x, y, STAR_OUT * side, dir(k)))
      points.push(at(x, y, STAR_IN * side, dir(k + 1)))
    }
    return points
  }

  // 菱形（鋭角 36 度）。長い対角線が矢印の向き
  return [
    at(x, y, RHOMB_LONG * side, dir(0)),
    at(x, y, RHOMB_SHORT * side, angleOf(a) + Math.PI / 2),
    at(x, y, RHOMB_LONG * side, dir(5)),
    at(x, y, RHOMB_SHORT * side, angleOf(a) - Math.PI / 2),
  ]
}

/* --- 置換規則 --- */

/**
 * タイル 1 枚を、1/φ² に縮んだタイルの集まりに置き換えて out に足す。
 *
 * 距離はどれも親の辺の長さに対する比で、向きは親の向きからの目盛り差で書ける。
 * inwardParity は菱形の矢印の向きを決める（下の pentagon の項を参照）。
 */
function substituteTile(tile, side, angleOf, inwardParity, out) {
  const { type, x, y, a } = tile
  const put = (t, r, step, tileAngle, role) => {
    const angle = angleOf(a + step)
    out.push({
      type: t,
      x: x + r * side * Math.cos(angle),
      y: y + r * side * Math.sin(angle),
      a: tileAngle,
      role,
    })
  }

  if (type === 'pentagon') {
    // 五角形は 6 つの五角形に分かれる（中心 1 枚 + 頂点側 5 枚）。
    // 辺の中点には菱形が半分ずつはみ出して、隣の五角形が出す半分と合わさり 1 枚になる。
    out.push({ type: 'pentagon', x, y, a: a + 1, role: 'pentagonCenter' })
    for (let k = 1; k < 10; k += 2) put('pentagon', STAR_IN, k, a, 'pentagonRing')

    // 菱形の矢印は、両側の五角形のうち向きが inwardParity のほうを指す。
    // 隣り合う五角形は必ず向きが違うので、1 枚の菱形について矢印が 1 つに定まる。
    const inward = (((a % 2) + 2) % 2) === inwardParity
    for (let k = 0; k < 10; k += 2) {
      put('diamond', PENT_IN, k, a + k + (inward ? 5 : 0), 'diamond')
    }
    return
  }

  if (type === 'star' || type === 'boat') {
    // 星は真ん中に 36 度回した星が入り、とがりの向きに五角形と舟が並ぶ。
    // 舟は星のとがり 3 つぶんの形なので、同じ規則を 3 方向にだけ使う。
    out.push({ type: 'star', x, y, a: a + 1, role: 'star' })
    for (const k of type === 'star' ? [0, 2, 4, 6, 8] : [-2, 0, 2]) {
      put('pentagon', STAR_IN, k, a + k, 'pentagonGap')
      put('boat', STAR_OUT - STAR_IN, k, a + k, 'boat')
    }
    return
  }

  // 菱形は矢印の側に五角形が寄り、その先に舟、反対側のとがりに星が入る
  put('pentagon', PENT_OUT * SHRINK * RHOMB_SHORT, 0, a, 'pentagonGap')
  put('boat', RHOMB_LONG - STAR_IN, 0, a, 'boat')
  put('star', RHOMB_LONG - STAR_IN, 5, a + 5, 'star')
}

/** 多角形の面積 */
export function polygonArea(points) {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

function pointInPolygon(points, x, y) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * 五角形は 5 辺すべてに菱形を出すが、辺の向こうが星や舟なら
 * その隙間は星や舟が埋めるので、菱形は要らない。重なるものを落とす。
 */
function dropCoveredDiamonds(tiles, side, angleOf) {
  const blockers = tiles.filter((t) => t.type === 'star' || t.type === 'boat')
  if (blockers.length === 0) return tiles

  // 星も舟も中心から STAR_OUT × 辺 までしか広がらないので、隣接マスだけ見れば足りる
  const cell = 2 * STAR_OUT * side
  const grid = new Map()
  for (const b of blockers) {
    const key = `${Math.floor(b.x / cell)},${Math.floor(b.y / cell)}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(b)
  }

  return tiles.filter((tile) => {
    if (tile.type !== 'diamond') return true
    const gx = Math.floor(tile.x / cell)
    const gy = Math.floor(tile.y / cell)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const b of grid.get(`${gx + dx},${gy + dy}`) ?? []) {
          if (pointInPolygon(tileShape(b, side, angleOf), tile.x, tile.y)) return false
        }
      }
    }
    return true
  })
}

/** 重なって二重に生まれたタイルを 1 枚にまとめる */
function dedupe(tiles, side) {
  const grid = side * 1e-3
  const seen = new Map()
  for (const tile of tiles) {
    // 五角形と星は 72 度（目盛り 2 つ）回すと元に戻る
    const period = tile.type === 'pentagon' || tile.type === 'star' ? 2 : 10
    const a = ((tile.a % period) + period) % period
    const key = `${tile.type}:${Math.round(tile.x / grid)}:${Math.round(tile.y / grid)}:${a}`
    if (!seen.has(key)) seen.set(key, tile)
  }
  return [...seen.values()]
}

/* --- タイリングの組み立て --- */

/**
 * 五角形ペンローズタイリングを作る。
 *
 * 種は星 1 枚。置換のたびに辺の長さが 1/φ² ずつ縮み、
 * 種の星の内接円（半径 0.525731 × 種の辺）の内側が隙間なく埋まる。
 * 描画範囲から遠いタイルは各段で捨てて、枚数が増えすぎないようにする。
 *
 * @param side 最終的なタイルの辺の長さ
 * @param baseAngle 全体の回転（ラジアン）
 * @param view 描く範囲 { x, y, radius }（タイリングの座標系）
 * @param inwardParity 菱形の矢印の決め方（0 か 1。鏡像の関係になる）
 */
export function buildTiling({ side, baseAngle = 0, view, inwardParity = 0 }) {
  const angleOf = (a) => baseAngle + a * STEP

  // 種の星が描画範囲を覆う大きさになるまで置換を重ねる
  const reach = (Math.hypot(view.x, view.y) + view.radius) / STAR_IN
  const levels = Math.max(1, Math.ceil(Math.log(reach / side) / Math.log(PHI * PHI)))

  let currentSide = side * (PHI * PHI) ** levels
  let tiles = [{ type: 'star', x: 0, y: 0, a: 0, role: 'star' }]

  for (let level = 0; level < levels; level++) {
    const next = []
    for (const tile of tiles) substituteTile(tile, currentSide, angleOf, inwardParity, next)
    currentSide *= SHRINK
    // 置換で届く範囲より外にあるタイルは、この先も描画範囲に入ってこない
    const margin = view.radius + REACH * currentSide
    tiles = dropCoveredDiamonds(dedupe(next, currentSide), currentSide, angleOf).filter(
      (t) => Math.hypot(t.x - view.x, t.y - view.y) < margin,
    )
  }

  return { tiles, side: currentSide, angleOf }
}
