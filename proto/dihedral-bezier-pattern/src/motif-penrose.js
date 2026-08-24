/**
 * 五角形ペンローズタイリングの配色。
 *
 * タイリング自体は置換規則で決まってしまうので、模様の違いは
 * 「どこをどの向きで切り取るか」（seed で決まる）と「タイルの分け方」で作る。
 *
 * 分け方は色数を増やすほど細かくなるようにして、色数どうしを見比べられるようにする。
 * 色番号は最後に、見えている面積の大きい順に振り直す。
 */

import { tileShape, polygonArea } from './penrose-geometry.js'

const PENTAGONS = ['pentagonCenter', 'pentagonRing', 'pentagonGap']

/**
 * 色数ごとのタイルの分け方。
 * 色数を 1 つ増やすと、前の分け方のどれかが 2 つに割れるだけにしてある。
 */
const GROUPS = {
  2: [PENTAGONS, ['star', 'boat', 'diamond']],
  3: [PENTAGONS, ['star', 'boat'], ['diamond']],
  4: [PENTAGONS, ['star'], ['boat'], ['diamond']],
  5: [['pentagonCenter', 'pentagonRing'], ['pentagonGap'], ['star'], ['boat'], ['diamond']],
  6: [['pentagonCenter'], ['pentagonRing'], ['pentagonGap'], ['star'], ['boat'], ['diamond']],
}

/**
 * タイルに色番号を振る。
 *
 * @param tiles buildTiling が返したタイル
 * @param viewport 画面に入る範囲 { x, y, half }（面積を数えるのに使う）
 */
export function buildPenroseMotif({ tiles, side, angleOf, colorCount, viewport }) {
  const groups = GROUPS[colorCount]
  if (!groups) throw new Error(`色数 ${colorCount} の分け方が定義されていません`)

  const groupOf = new Map()
  groups.forEach((roles, index) => {
    for (const role of roles) groupOf.set(role, index)
  })

  const areas = new Array(groups.length).fill(0)
  const shaped = tiles.map((tile) => {
    const points = tileShape(tile, side, angleOf)
    const group = groupOf.get(tile.role)
    // 見えている面積だけを数える。画面の外まで数えると、
    // 切り取り方によって色の並び順が変わってしまう
    const visible =
      Math.abs(tile.x - viewport.x) < viewport.half && Math.abs(tile.y - viewport.y) < viewport.half
    if (visible) areas[group] += polygonArea(points)
    return { points, group }
  })

  // 色はインデックスが小さいほど使用面積が大きい
  const rank = areas
    .map((area, index) => ({ area, index }))
    .sort((a, b) => b.area - a.area)
    .map(({ index }) => index)
  const colorOf = new Array(groups.length)
  rank.forEach((group, colorIndex) => {
    colorOf[group] = colorIndex
  })

  return {
    elements: shaped.map(({ points, group }) => ({ points, colorIndex: colorOf[group] })),
  }
}
