// Cytoscape のセットアップと、走査結果 → グラフ要素の同期・表示制御。

import cytoscape from "cytoscape"
import fcose from "cytoscape-fcose"
import layoutUtilities from "cytoscape-layout-utilities"
import {
  EDGE_COLORS,
  GHOST_OPACITY,
  LABEL_FONT_SIZE,
  LABEL_MIN_ZOOMED_FONT_SIZE,
  NODE_SIZES,
  STATE_COLORS,
  UI_COLORS,
  UNIT_PADDING,
  UNIT_SHAPE_POINTS
} from "./theme.js"

cytoscape.use(fcose)
// 連結成分がばらけたときの詰め込み（fcose の packComponents）に使われる。
cytoscape.use(layoutUtilities)

const nodeColor = (ele) => STATE_COLORS[ele.data("state")] ?? STATE_COLORS.published
const nodeSize = (ele) => NODE_SIZES[ele.data("state")] ?? NODE_SIZES.published
const edgeColor = (ele) => EDGE_COLORS[ele.data("severity")] ?? EDGE_COLORS.none

/** Cytoscape のスタイル定義。 */
export const GRAPH_STYLE = [
  {
    // --- ユニットの囲み（blob）---
    // ラベルは出さない。どのユニットかはフィルタとサイドパネルの所属バッジで分かる。
    selector: "node[kind = 'unit']",
    style: {
      shape: "polygon",
      "shape-polygon-points": UNIT_SHAPE_POINTS,
      "background-color": UI_COLORS.unitFill,
      "background-opacity": 1,
      "border-width": 1.5,
      "border-color": UI_COLORS.unitBorder,
      padding: UNIT_PADDING,
      "min-width": 40,
      "min-height": 40,
      label: "",
      events: "no"
    }
  },
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
      "min-zoomed-font-size": LABEL_MIN_ZOOMED_FONT_SIZE,
      "text-valign": "center",
      "text-halign": "right",
      "text-margin-x": 5,
      "text-outline-width": 3,
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
    // --- ゴースト（OFF の大分類にあるリンク先）---
    selector: "node.ghost",
    style: {
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
    // 選択したノードの周辺以外を沈める。囲みは沈めない（位置の手がかりとして残す）。
    selector: ".faded",
    style: { opacity: 0.12, "text-opacity": 0 }
  },
  {
    // ホバー中のノードは、沈んでいても・引いていても必ずラベルを出す。
    selector: "node.hover-labeled",
    style: { opacity: 1, "text-opacity": 1, "min-zoomed-font-size": 0, "z-index": 60 }
  },
  {
    selector: ".hidden",
    style: { display: "none" }
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

  for (const unit of data.units) {
    desired.set(unit.id, {
      group: "nodes",
      data: { id: unit.id, kind: "unit", label: unit.label, groupId: unit.group },
      selectable: false,
      grabbable: false
    })
  }
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

    // 2) 消えたページ。囲みを消す前に外へ出しておく（親を消すと子も一緒に消えるため）。
    for (const node of cy.nodes('[kind = "page"]').toArray()) {
      if (!desired.has(node.id())) cy.remove(node)
    }
    for (const unit of cy.nodes('[kind = "unit"]').toArray()) {
      if (!desired.has(unit.id())) {
        unit.children().move({ parent: null })
        cy.remove(cy.$id(unit.id()))
      }
    }

    // 3) 新しい要素。囲み → ページ → エッジの順（親と端点が先に存在している必要がある）。
    const additions = []
    for (const element of desired.values()) {
      if (cy.$id(element.data.id).nonempty()) continue
      additions.push(element)
    }
    const order = { unit: 0, page: 1 }
    additions.sort(
      (a, b) =>
        (a.group === "edges" ? 2 : order[a.data.kind]) -
        (b.group === "edges" ? 2 : order[b.data.kind])
    )
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
 * 可視性の判定結果から、レイアウトにかける要素のコレクションを作る。
 *
 * Cytoscape の `visible()` / `css("display")` はスタイルのキャッシュ次第で古い値を返すことがあるので、
 * レイアウトには「隠したものを含まないコレクション」を明示的に渡す。
 *
 * @param {import("cytoscape").Core} cy
 * @param {ReturnType<typeof computeVisibility>} plan
 */
export const visibleCollection = (cy, plan) =>
  cy.elements().filter((ele) => {
    const id = ele.id()
    return plan.visibleNodes.has(id) || plan.visibleUnits.has(id) || plan.visibleEdges.has(id)
  })

/**
 * 可視性の判定結果をグラフに反映する。
 *
 * @param {import("cytoscape").Core} cy
 * @param {ReturnType<typeof computeVisibility>} plan
 * @returns {Set<string>} 親（囲み）が変わったノードの id。座標の引き継ぎを打ち切る対象
 */
export const applyVisibility = (cy, plan) => {
  const reparented = new Set()

  cy.batch(() => {
    for (const node of cy.nodes('[kind = "unit"]').toArray()) {
      node.toggleClass("hidden", !plan.visibleUnits.has(node.id()))
    }

    for (const node of cy.nodes('[kind = "page"]').toArray()) {
      const id = node.id()

      // 囲みの中に入るのは本体だけ。ゴーストとリンク切れは囲みの外に置く。
      const parent = plan.primary.has(id) ? (node.data("unit") ?? null) : null
      if ((node.parent().id() ?? null) !== parent) {
        node.move({ parent })
        reparented.add(id)
      }

      node.toggleClass("hidden", !plan.visibleNodes.has(id))
      node.toggleClass("ghost", plan.ghosts.has(id))
    }

    for (const edge of cy.edges().toArray()) {
      edge.toggleClass("hidden", !plan.visibleEdges.has(edge.id()))
    }
  })

  return reparented
}
