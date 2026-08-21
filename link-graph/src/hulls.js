// ユニットの囲み。cytoscape-bubblesets（BubbleSets）で描く。
//
// compound node の外接矩形ではなく、メンバーのノードとエッジが張る影響場の等値線なので、
// ノードが動けば囲みの形も追いかけて変わる。輪郭は cytoscape-layers が
// ノードレイヤーの下に挿した SVG レイヤーに path として 1 ユニット 1 本ずつ吐かれる。
//
// 更新の引き金は「メンバーの position イベント」で、プラグイン側が `throttle` ms で
// 間引く。毎フレーム再計算はしないので、囲みはノードから少し遅れて追従する
// （重い計算を避けつつ、粘性のある動きになる）。

import { BubbleSetsPlugin } from "cytoscape-bubblesets"

import { HULL_OPTIONS, UI_COLORS } from "./theme.js"

/** メンバー（とその間のエッジ）の顔ぶれを表すキー。変わったら path を作り直す。 */
const membershipKey = (nodeIds, edgeIds) =>
  `${[...nodeIds].sort().join("|")}//${[...edgeIds].sort().join("|")}`

/**
 * 囲みの管理を作る。
 *
 * @param {import("cytoscape").Core} cy
 */
export const createHulls = (cy) => {
  const plugin = new BubbleSetsPlugin(cy, {
    ...HULL_OPTIONS,
    style: {
      fill: UI_COLORS.unitFill,
      stroke: UI_COLORS.unitBorder,
      strokeWidth: "1.5",
      // 拡大縮小しても輪郭の太さを一定に保つ（SVG レイヤーは pan / zoom で拡大される）。
      vectorEffect: "non-scaling-stroke",
      pointerEvents: "none"
    }
  })

  /** @type {Map<string, { path: import("cytoscape-bubblesets").BubbleSetPath, key: string }>} */
  const paths = new Map()

  /**
   * 表示中のユニットに合わせて囲みを張り替える。
   *
   * BubbleSets の path は生成時のコレクションを掴んだままなので、メンバーが増減したら
   * 作り直す（ノードの移動だけならプラグイン側が追従する）。
   *
   * @param {Map<string, string[]>} members ユニット id → メンバーのページ id
   */
  const sync = (members) => {
    /** @type {Map<string, { nodes: import("cytoscape").NodeCollection, edges: import("cytoscape").EdgeCollection, key: string }>} */
    const next = new Map()

    for (const [unit, ids] of members) {
      const wanted = new Set(ids)
      const nodes = cy.nodes().filter((node) => wanted.has(node.id()))
      // ユニット内のエッジも囲みに含める。枝の伸びた方向へ囲みが伸びるようになる。
      const edges = nodes.edgesWith(nodes).filter((edge) => !edge.hasClass("hidden"))
      next.set(unit, {
        nodes,
        edges,
        key: membershipKey(
          ids,
          edges.map((edge) => edge.id())
        )
      })
    }

    for (const [unit, entry] of [...paths]) {
      if (next.get(unit)?.key === entry.key) continue
      plugin.removePath(entry.path)
      paths.delete(unit)
    }

    for (const [unit, entry] of next) {
      if (paths.has(unit)) continue
      const path = plugin.addPath(entry.nodes, entry.edges, null)
      paths.set(unit, { path, key: entry.key })
    }
  }

  /** 囲みを描き直す。落ち着いたあとに 1 回呼んで、間引かれた最後の形を確定させる。 */
  const update = () => plugin.update(true)

  return { sync, update }
}
