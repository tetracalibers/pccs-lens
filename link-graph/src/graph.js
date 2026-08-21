// Cytoscape のセットアップと、走査結果 → グラフ要素の同期・表示制御。
//
// ここが持つのは記事ページとエッジだけ。ユニットの囲みは Cytoscape の要素ではなく、
// BubbleSets の輪郭として別レイヤーに描く（hulls.js）。座標もここでは決めず、
// d3-force のシミュレーション（simulation.js）が毎フレーム流し込む。

import cytoscape from "cytoscape"
import {
  EDGE_COLORS,
  GHOST_COLOR,
  GHOST_OPACITY,
  LABEL_FONT_FAMILY,
  LABEL_FONT_SIZE,
  LABEL_MARGIN_X,
  LABEL_MIN_ZOOMED_FONT_SIZE,
  LABEL_OUTLINE_WIDTH,
  NODE_SIZES,
  STATE_COLORS,
  UI_COLORS
} from "./theme.js"

const nodeColor = (ele) => STATE_COLORS[ele.data("state")] ?? STATE_COLORS.published
const nodeSize = (ele) => NODE_SIZES[ele.data("state")] ?? NODE_SIZES.published
const edgeColor = (ele) => EDGE_COLORS[ele.data("severity")] ?? EDGE_COLORS.none

/** Cytoscape のスタイル定義。 */
export const GRAPH_STYLE = [
  {
    // --- 記事ページ ---
    // ラベル（記事タイトル）は常時オン。縮小して読めなくなったら
    // min-zoomed-font-size で Cytoscape 側が落とす。
    selector: "node[kind = 'page']",
    style: {
      shape: "ellipse",
      "background-color": nodeColor,
      width: nodeSize,
      height: nodeSize,
      "border-width": 0,
      label: "data(label)",
      color: UI_COLORS.text,
      "font-size": LABEL_FONT_SIZE,
      // フォントは Cytoscape の既定と同じ値を明示する（ラベルの実寸を測る labels.js と
      // 同じ指定を使うため。既定に任せると、測る側と描く側でずれても気づけない）。
      "font-family": LABEL_FONT_FAMILY,
      "min-zoomed-font-size": LABEL_MIN_ZOOMED_FONT_SIZE,
      "text-valign": "center",
      "text-halign": "right",
      "text-margin-x": LABEL_MARGIN_X,
      "text-outline-width": LABEL_OUTLINE_WIDTH,
      "text-outline-color": UI_COLORS.background,
      "text-outline-opacity": 0.9,
      "text-wrap": "none",
      "z-index": 10
    }
  },
  {
    // 所属ユニットが解決できなかったページ（YAML 未登録）は枠で警告する。
    selector: "node[warning = 'unit-unresolved']",
    style: {
      "border-width": 2,
      "border-style": "dashed",
      "border-color": STATE_COLORS.draft
    }
  },
  {
    // --- エッジ ---
    selector: "edge",
    style: {
      "curve-style": "bezier",
      width: (ele) => (ele.data("severity") === "none" ? 1 : 1.7),
      "line-color": edgeColor,
      "target-arrow-color": edgeColor,
      "source-arrow-color": edgeColor,
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.65,
      opacity: 0.8,
      "z-index": 1
    }
  },
  {
    // 相互リンクは双方向の矢印 1 本にする。
    selector: "edge[?bidirectional]",
    style: { "source-arrow-shape": "triangle" }
  },
  {
    // --- ゴースト（非表示ノードへのリンク先）---
    // 状態の色は使わず、専用のグレーで塗る（画面に出ていない先、という一点だけを伝える）。
    selector: "node.ghost",
    style: {
      "background-color": GHOST_COLOR,
      opacity: GHOST_OPACITY,
      "border-width": 1,
      "border-style": "dashed",
      "border-color": UI_COLORS.border
    }
  },
  {
    // 選択したノードの周辺は、引いた状態でもラベルを読めるようにする。
    selector: "node.focus-labeled",
    style: { "min-zoomed-font-size": 0, "z-index": 40 }
  },
  {
    // --- 選択したノードとその周辺 ---
    selector: "node[kind = 'page']:selected",
    style: {
      "border-width": 2.5,
      "border-style": "solid",
      "border-color": UI_COLORS.selectionRing,
      "border-opacity": 1,
      opacity: 1,
      "text-opacity": 1,
      "z-index": 50
    }
  },
  {
    selector: "edge.highlighted",
    style: { width: 2.6, opacity: 1, "z-index": 20 }
  },
  {
    // 選択したノードの周辺以外を沈める。囲みは別レイヤーなので沈まず、位置の手がかりとして残る。
    selector: ".faded",
    style: { opacity: 0.12, "text-opacity": 0 }
  },
  {
    // ホバー中のノードは、沈んでいても・引いていても必ずラベルを出す。
    selector: "node.hover-labeled",
    style: { opacity: 1, "text-opacity": 1, "min-zoomed-font-size": 0, "z-index": 60 }
  },
  {
    // シミュレーションが動いている間はラベルを消す。流れる文字は読めないうえ、
    // 169 ノード分のテキスト描画が毎フレーム乗ると素直に重い。
    selector: ".no-label",
    style: { label: "" }
  },
  {
    selector: ".hidden",
    style: { display: "none" }
  },
  {
    // ヘッダーのチップでの絞り込みから外れたもの。`.hidden`（フィルタ）とは別軸で、
    // **配置には一切触らず**表示だけを落とす。
    //
    // `display: none` にしないのは BubbleSets のため。囲みはメンバーの `boundingBox()` から
    // 形を決めるが、`display: none` の要素は原点の 0 サイズとして返るので、絞り込むだけで
    // 囲みが原点へ引き伸ばされてしまう。透明にして当たり判定だけ切る形にすれば、囲みは
    // 絞り込みの前後で 1 px も動かない。
    selector: ".filtered-out",
    style: { opacity: 0, "text-opacity": 0, events: "no" }
  }
]

/**
 * Cytoscape のインスタンスを作る。
 *
 * @param {HTMLElement} container
 * @returns {import("cytoscape").Core}
 */
export const createGraph = (container) =>
  cytoscape({
    container,
    wheelSensitivity: 0.25,
    minZoom: 0.15,
    maxZoom: 4,
    style: GRAPH_STYLE
  })

/** 走査結果のノードから、Cytoscape に渡す data を作る。 */
const toNodeData = (node) => ({
  id: node.id,
  kind: "page",
  label: node.title,
  state: node.state,
  groupId: node.group,
  unit: node.unit,
  warning: node.warning,
  isolated: node.isolated
})

/**
 * 走査結果に合わせて要素を足し引きする。生き残ったノードの座標は Cytoscape 側にそのまま残る。
 *
 * @param {import("cytoscape").Core} cy
 * @param {object} data 走査結果
 */
export const syncElements = (cy, data) => {
  /** @type {Map<string, object>} */
  const desired = new Map()

  for (const node of data.nodes) {
    desired.set(node.id, { group: "nodes", data: toNodeData(node) })
  }
  for (const edge of data.edges) {
    desired.set(edge.id, {
      group: "edges",
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        bidirectional: edge.bidirectional,
        severity: edge.severity
      }
    })
  }

  cy.batch(() => {
    // 1) 消えたエッジ
    for (const edge of cy.edges().toArray()) {
      if (!desired.has(edge.id())) cy.remove(edge)
    }

    // 2) 消えたページ
    for (const node of cy.nodes().toArray()) {
      if (!desired.has(node.id())) cy.remove(node)
    }

    // 3) 新しい要素。ページ → エッジの順（端点が先に存在している必要がある）。
    const additions = []
    for (const element of desired.values()) {
      if (cy.$id(element.data.id).nonempty()) continue
      additions.push(element)
    }
    additions.sort((a, b) => (a.group === "edges" ? 1 : 0) - (b.group === "edges" ? 1 : 0))
    cy.add(additions)

    // 4) 残った要素の data を更新（タイトルや状態が変わっている場合がある）。
    for (const element of desired.values()) {
      const existing = cy.$id(element.data.id)
      if (existing.empty()) continue
      for (const [key, value] of Object.entries(element.data)) {
        if (key === "id" || key === "source" || key === "target") continue
        if (existing.data(key) !== value) existing.data(key, value)
      }
    }
  })
}

/**
 * フィルタから「何をどう見せるか」を決める。
 *
 * ゴースト表示: OFF の大分類のページであっても、ON 側のページからリンクが張られている先は
 * 薄く表示して囲みの外に置く。色系 103 ノードで画面を占領されずに、依存先だけが見える状態にする。
 *
 * @param {object} data 走査結果
 * @param {{ groups: Set<string>, units: Set<string>, showIsolated: boolean }} filters
 */
export const computeVisibility = (data, filters) => {
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]))

  /** 大分類・ユニットのトグルと孤立フィルタを通ったページ（囲みの中に置く本体）。 */
  const primary = new Set()
  for (const node of data.nodes) {
    if (node.state === "broken") continue
    if (!filters.groups.has(node.group)) continue
    // 所属不明（unit なし）のページは、大分類が ON なら囲みの外に出す。
    if (node.unit && !filters.units.has(node.unit)) continue
    if (!filters.showIsolated && node.isolated) continue
    primary.add(node.id)
  }

  const ghosts = new Set()
  const brokenVisible = new Set()

  /** `from` が表示中なら、そのリンク先 `to` をゴースト（またはリンク切れ）として見せる。 */
  const trace = (from, to) => {
    if (!primary.has(from) || primary.has(to)) return
    const node = nodeById.get(to)
    if (node.state === "broken") brokenVisible.add(to)
    else if (node.group && !filters.groups.has(node.group)) ghosts.add(to)
  }

  for (const edge of data.edges) {
    trace(edge.source, edge.target)
    if (edge.bidirectional) trace(edge.target, edge.source)
  }

  const visibleNodes = new Set([...primary, ...ghosts, ...brokenVisible])

  // 片方だけがゴーストという線は残すが、ゴースト同士をつなぐ線は出さない（ノイズになる）。
  const visibleEdges = new Set(
    data.edges
      .filter(
        (edge) =>
          visibleNodes.has(edge.source) &&
          visibleNodes.has(edge.target) &&
          (primary.has(edge.source) || primary.has(edge.target))
      )
      .map((edge) => edge.id)
  )

  const visibleUnits = new Set()
  for (const id of primary) {
    const unit = nodeById.get(id).unit
    if (unit) visibleUnits.add(unit)
  }

  return { primary, ghosts, visibleNodes, visibleEdges, visibleUnits }
}

/**
 * 可視性の判定結果をグラフに反映する。
 *
 * 囲みに入るかどうか（本体かゴーストか）は Cytoscape 側では表現しない。
 * 囲みの対象は hulls.js が `plan.primary` から、ユニットの引力は simulation.js が
 * ノードごとの `unit` から決める。
 *
 * @param {import("cytoscape").Core} cy
 * @param {ReturnType<typeof computeVisibility>} plan
 */
export const applyVisibility = (cy, plan) => {
  cy.batch(() => {
    for (const node of cy.nodes().toArray()) {
      const id = node.id()
      node.toggleClass("hidden", !plan.visibleNodes.has(id))
      node.toggleClass("ghost", plan.ghosts.has(id))
    }

    for (const edge of cy.edges().toArray()) {
      edge.toggleClass("hidden", !plan.visibleEdges.has(edge.id()))
    }
  })
}
