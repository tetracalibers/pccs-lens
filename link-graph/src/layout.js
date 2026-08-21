// fcose によるレイアウト。
//
// 走査のたびにレイアウトが組み直されて位置が変わると「さっき見ていた赤がどこへ行ったか」が
// 追えなくなるので、**既存ノードは前回の座標に固定し、新規ノードだけを配置し直す**。
// fcose は乱数を使うため、シードを固定した擬似乱数で Math.random を差し替えて回す。

import { LAYOUT_SEED } from "./theme.js"

/** mulberry32。シードから決定的な擬似乱数列を作る。 */
const createRandom = (seed) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Math.random をシード付きの擬似乱数に差し替える。返り値を呼ぶと元に戻る。 */
const patchRandom = (seed) => {
  const original = Math.random
  Math.random = createRandom(seed)
  return () => {
    Math.random = original
  }
}

/**
 * レイアウトを実行する。
 *
 * @param {import("cytoscape").Collection} eles レイアウトにかける要素（表示中のものだけ）
 * @param {object} options
 * @param {Map<string, { x: number, y: number }>} options.pinned 前回の座標に固定するノード（id → 座標）
 * @param {boolean} options.fit ビューポートを合わせ直すか
 */
export const runLayout = (eles, { pinned, fit }) => {
  // フィルタで全部消えているときは何もしない（fcose の成分パッキングが空配列で落ちる）。
  if (eles.nodes().length === 0) return

  const fixedNodeConstraint = [...pinned]
    .filter(([id]) => eles.getElementById(id).nonempty())
    .map(([id, position]) => ({ nodeId: id, position }))

  const layout = eles.layout({
    name: "fcose",
    quality: "proof",
    randomize: true,
    animate: false,
    fit,
    padding: 48,
    nodeSeparation: 95,
    idealEdgeLength: 70,
    nodeRepulsion: 8000,
    edgeElasticity: 0.4,
    nestingFactor: 0.12,
    gravity: 0.3,
    gravityCompound: 1.4,
    gravityRangeCompound: 1.5,
    packComponents: true,
    tile: true,
    fixedNodeConstraint: fixedNodeConstraint.length ? fixedNodeConstraint : undefined
  })

  const restore = patchRandom(LAYOUT_SEED)
  layout.one("layoutstop", restore)
  try {
    layout.run()
  } finally {
    restore()
  }
}
