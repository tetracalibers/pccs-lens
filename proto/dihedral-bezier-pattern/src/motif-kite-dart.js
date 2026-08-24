/**
 * カイト＆ダートタイリングの配色。
 *
 * タイリング自体は分割規則で決まってしまうので、模様の違いは
 * 「どこをどの向きで切り取るか」（seed で決まる）と「タイルの分け方」で作る。
 *
 * 分け方は色数を増やすほど細かくなるようにして、色数どうしを見比べられるようにする。
 * 色番号は最後に、見えている面積の大きい順に振り直す。
 */

import { polygonArea } from './kite-dart-geometry.js'

const KITES_FROM_KITE = ['kiteFromKiteKite', 'kiteFromKiteDart']
const KITES = [...KITES_FROM_KITE, 'kiteFromDart']
const DARTS = ['dartBetweenKites', 'dartBetweenKiteDart', 'dartBetweenDarts']

/**
 * 色数ごとのタイルの分け方。
 * 色数を 1 つ増やすと、前の分け方のどれかが 2 つに割れるだけにしてある。
 *
 * 準結晶版（`motif-crystal.js`）も `--color-by=class` のときにこの表を使う。
 */
export const GROUPS = {
  2: [KITES, DARTS],
  3: [KITES_FROM_KITE, ['kiteFromDart'], DARTS],
  4: [
    KITES_FROM_KITE,
    ['kiteFromDart'],
    ['dartBetweenKites'],
    ['dartBetweenKiteDart', 'dartBetweenDarts'],
  ],
  5: [
    KITES_FROM_KITE,
    ['kiteFromDart'],
    ['dartBetweenKites'],
    ['dartBetweenKiteDart'],
    ['dartBetweenDarts'],
  ],
  6: [
    ['kiteFromKiteKite'],
    ['kiteFromKiteDart'],
    ['kiteFromDart'],
    ['dartBetweenKites'],
    ['dartBetweenKiteDart'],
    ['dartBetweenDarts'],
  ],
}

/**
 * タイルに色番号を振る。
 *
 * @param tiles buildTiling が返したタイル
 * @param viewport 画面に入る範囲 { x, y, half }（面積を数えるのに使う）
 */
export function buildKiteDartMotif({ tiles, colorCount, viewport }) {
  const groups = GROUPS[colorCount]
  if (!groups) throw new Error(`色数 ${colorCount} の分け方が定義されていません`)

  const groupOf = new Map()
  groups.forEach((classes, index) => {
    for (const cls of classes) groupOf.set(cls, index)
  })

  const areas = new Array(groups.length).fill(0)
  const shaped = tiles.map((tile) => {
    const group = groupOf.get(tile.cls)
    // 見えている面積だけを数える。画面の外まで数えると、
    // 切り取り方によって色の並び順が変わってしまう
    const cx = tile.points.reduce((sum, [x]) => sum + x, 0) / tile.points.length
    const cy = tile.points.reduce((sum, [, y]) => sum + y, 0) / tile.points.length
    const visible =
      Math.abs(cx - viewport.x) < viewport.half && Math.abs(cy - viewport.y) < viewport.half
    if (visible) areas[group] += polygonArea(tile.points)
    return { points: tile.points, group }
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
