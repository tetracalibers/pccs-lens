// 画面の組み立て。走査結果の取得 → グラフの同期 → フィルタ適用 → シミュレーション、
// という流れを回す。
//
// 配置は d3-force のシミュレーションが持ち、毎フレームその座標を Cytoscape へ流し込む
// （`pumpPositions`）。囲みはノードの position イベントを見て BubbleSets が追従する。
//
// **初回ロードはアニメーションを見せない。** 裏で解き切ってから結果だけを描く（配置が
// 決まるまでのチラつきを避けるため）。動かすのは「再配置」ボタン・増えた分の落ち着き・
// ドラッグの揺り戻しだけ。走査やフィルタのたびに全体が泳ぐと「さっき見ていた赤がどこへ
// 行ったか」が追えなくなるので、再走査時は既存ノードを固定して増えた分だけを落ち着かせる。

import { UPDATE_EVENT } from "../scan/events.mjs"
import { createFilters } from "./filters.js"
import { applyVisibility, computeVisibility, createGraph, syncElements } from "./graph.js"
import { createHulls } from "./hulls.js"
import { renderPanel } from "./panel.js"
import { createSimulation } from "./simulation.js"
import { GHOST_OPACITY, STATE_COLORS, UI_COLORS } from "./theme.js"

// --- theme.js の値を CSS カスタムプロパティへ流し込む（色の実値は theme.js が唯一の情報源）---

const cssVariables = {
  "--ui-background": UI_COLORS.background,
  "--ui-surface": UI_COLORS.surface,
  "--ui-border": UI_COLORS.border,
  "--ui-text": UI_COLORS.text,
  "--ui-text-muted": UI_COLORS.textMuted,
  "--ui-accent": UI_COLORS.accent,
  "--state-broken": STATE_COLORS.broken,
  "--state-empty": STATE_COLORS.empty,
  "--state-draft": STATE_COLORS.draft,
  "--state-published": STATE_COLORS.published,
  "--ghost-opacity": String(GHOST_OPACITY)
}
for (const [name, value] of Object.entries(cssVariables)) {
  document.documentElement.style.setProperty(name, value)
}

// --- DOM ---

const canvasArea = document.querySelector(".canvas")
const canvas = document.querySelector("#cy")
const statsElement = document.querySelector("#stats")
const panelElement = document.querySelector("#panel")
const filtersElement = document.querySelector("#filters")
const relayoutButton = document.querySelector("#relayout")

const cy = createGraph(canvas)
const hulls = createHulls(cy)

// --- 状態 ---

/** 直近の走査結果。 */
let data = null

/** 選択中のノードのパス。再走査をまたいで保つ。 */
let selectedPath = null

/** 初回ロードかどうか。立っている間はアニメーションなしで解き、最後に 1 回だけ fit する。 */
let isFirstLoad = true

/** シミュレーションが落ち着いたときに fit するか（「再配置」のときだけ立てる）。 */
let fitOnSettle = false

/** パス → 走査結果のノード。サイドパネルの引き回しに使う。 */
let nodeIndex = new Map()

/** id → 走査結果のエッジ。シミュレーションのリンクを作るのに使う。 */
let edgeIndex = new Map()

/** ユニット id の並び。初期配置のスロット割り当てに使う（走査結果の順）。 */
let unitOrder = []

const filters = createFilters(filtersElement, () => applyFilters())

// --- シミュレーションの座標を Cytoscape へ流し込む ---

const pumpPositions = () => {
  cy.batch(() => {
    for (const node of simulation.nodes()) {
      const element = cy.$id(node.id)
      if (element.nonempty()) element.position({ x: node.x, y: node.y })
    }
  })
}

const fitVisible = () => {
  const visible = cy.elements().not(".hidden")
  if (visible.nonempty()) cy.fit(visible, 60)
}

const simulation = createSimulation({
  onTick: pumpPositions,
  onSettle: () => {
    pumpPositions()
    // 間引かれて描き残っていた囲みを、最後の形で描き直す。
    hulls.update()
    cy.nodes().removeClass("no-label")
    if (fitOnSettle) {
      fitVisible()
      fitOnSettle = false
    }
    renderRelayoutButton()
    updateFocus()
  }
})

/** シミュレーションを動かす。動いている間はラベルを落とす。 */
const startMotion = (kick) => {
  cy.nodes().addClass("no-label")
  kick()
  renderRelayoutButton()
  // ノードが 0 件などで動かなかったときは、その場で後片付けまで済ませる。
  if (!simulation.isRunning()) cy.nodes().removeClass("no-label")
}

// --- 描画 ---

const renderRelayoutButton = () => {
  const running = simulation.isRunning()
  relayoutButton.textContent = running ? "停止" : "再配置"
  relayoutButton.title = running
    ? "シミュレーションを止めて、いまの配置で固定する"
    : "ユニットの中心から配置し直す（アニメーション）"
}

const renderStats = () => {
  const { stats } = data
  const chips = [
    { label: "ページ", value: stats.pages },
    { label: "本文なし", value: stats.empty, modifier: "empty" },
    { label: "draft", value: stats.draft, modifier: "draft" },
    { label: "公開済", value: stats.published },
    { label: "リンク切れ", value: stats.broken, modifier: "broken" },
    { label: "リンク", value: stats.rawLinks },
    { label: "エッジ", value: stats.edges }
  ]

  statsElement.replaceChildren()

  for (const chip of chips) {
    const wrapper = document.createElement("span")
    wrapper.className = `stat${chip.modifier ? ` stat--${chip.modifier}` : ""}`
    const value = document.createElement("span")
    value.className = "stat__value"
    value.textContent = String(chip.value)
    wrapper.append(document.createTextNode(chip.label), value)
    statsElement.append(wrapper)
  }

  for (const warning of [
    {
      label: "所属不明",
      value: stats.unresolvedUnits,
      title: "YAML に未登録で、所属ユニットが解決できないページ"
    },
    {
      label: "自己リンク",
      value: stats.selfLinks.length,
      title: stats.selfLinks.map((link) => `${link.path} L${link.line}`).join("\n")
    }
  ]) {
    if (!warning.value) continue
    const wrapper = document.createElement("span")
    wrapper.className = "stat stat--warn"
    wrapper.title = warning.title
    const value = document.createElement("span")
    value.className = "stat__value"
    value.textContent = String(warning.value)
    wrapper.append(document.createTextNode(warning.label), value)
    statsElement.append(wrapper)
  }

  const time = document.createElement("span")
  time.className = "stat"
  time.textContent = `走査 ${new Date(data.generatedAt).toLocaleTimeString("ja-JP")}`
  statsElement.append(time)
}

const renderSidePanel = () => {
  renderPanel(panelElement, {
    node: selectedPath ? (nodeIndex.get(selectedPath) ?? null) : null,
    nodeById: nodeIndex,
    unitLabels: new Map(data.units.map((unit) => [unit.id, unit.label])),
    groupLabels: new Map(data.groups.map((group) => [group.id, group.label])),
    onNavigate: (path) => select(path, { center: true })
  })
}

/** 選択中のノードの周辺だけを浮かせる。 */
const updateFocus = () => {
  cy.batch(() => {
    cy.elements().removeClass("faded focus-labeled highlighted")
    cy.nodes().unselect()

    if (!selectedPath) return
    const node = cy.$id(selectedPath)
    if (node.empty() || node.hasClass("hidden")) return

    node.select()
    const neighborhood = node.closedNeighborhood()
    cy.elements().difference(neighborhood).addClass("faded")
    neighborhood.nodes().addClass("focus-labeled")
    neighborhood.edges().addClass("highlighted")
  })
}

const select = (path, { center = false } = {}) => {
  selectedPath = path
  updateFocus()
  renderSidePanel()

  if (center && path) {
    const node = cy.$id(path)
    if (node.nonempty() && !node.hasClass("hidden")) {
      cy.animate({ center: { eles: node } }, { duration: 220 })
    }
  }
}

/** 表示中のユニットごとのメンバー（囲みに入るのは本体だけ）。 */
const hullMembers = (plan) => {
  /** @type {Map<string, string[]>} */
  const members = new Map()
  for (const unit of unitOrder) {
    if (plan.visibleUnits.has(unit)) members.set(unit, [])
  }
  for (const id of plan.primary) {
    const unit = nodeIndex.get(id)?.unit
    if (unit && members.has(unit)) members.get(unit).push(id)
  }
  return members
}

/**
 * 現在のフィルタをグラフへ反映し、増減した分だけを配置し直す。
 *
 * @param {object} [options]
 * @param {boolean} [options.replace] ユニットの中心から配置し直す（「再配置」ボタン）
 */
const applyFilters = ({ replace = false } = {}) => {
  const plan = computeVisibility(data, filters.state)
  applyVisibility(cy, plan)

  const nodes = [...plan.visibleNodes].map((id) => {
    const node = nodeIndex.get(id)
    return {
      id,
      state: node.state,
      // 囲みに入る本体だけがユニットの引力を受ける。ゴーストとリンク切れは囲みの外。
      unit: plan.primary.has(id) ? (node.unit ?? null) : null
    }
  })

  const links = [...plan.visibleEdges].map((id) => {
    const edge = edgeIndex.get(id)
    return { source: edge.source, target: edge.target }
  })

  // 全部やり直すとき以外は、生き残ったノードを現在の座標に固定して増えた分だけを落とす。
  const fromScratch = replace || isFirstLoad
  const { added } = simulation.sync({ nodes, links, unitOrder, pin: !fromScratch })

  // 初回はアニメーションを見せず、裏で解き切ってから結果だけを描く。
  if (isFirstLoad && !replace) simulation.solve()

  pumpPositions()
  hulls.sync(hullMembers(plan))

  if (replace) {
    fitOnSettle = true
    startMotion(() => simulation.restartFromUnits())
  } else if (isFirstLoad) {
    hulls.update()
    fitVisible()
    isFirstLoad = false
  } else if (added > 0) {
    startMotion(() => simulation.settle())
  } else {
    // 減っただけなら動かさない。固定は次のドラッグのために外しておく。
    simulation.unpin()
    hulls.update()
  }

  updateFocus()
}

/** 走査結果を受け取って画面全体を更新する。 */
const update = (next) => {
  data = next
  nodeIndex = new Map(data.nodes.map((node) => [node.id, node]))
  edgeIndex = new Map(data.edges.map((edge) => [edge.id, edge]))
  unitOrder = data.units.map((unit) => unit.id)
  syncElements(cy, data)
  filters.setData(data)
  renderStats()
  applyFilters()
  renderSidePanel()
}

// --- 入力 ---

cy.on("tap", 'node[kind = "page"]', (event) => select(event.target.id()))
cy.on("tap", (event) => {
  if (event.target === cy) select(null)
})

cy.on("mouseover", 'node[kind = "page"]', (event) => {
  event.target.addClass("hover-labeled")
  canvas.style.cursor = "pointer"
})
cy.on("mouseout", 'node[kind = "page"]', (event) => {
  event.target.removeClass("hover-labeled")
  canvas.style.cursor = ""
})

// ドラッグ中はシミュレーション側でもその座標に縛り、離したら周りが揺り戻す。
cy.on("grab drag", 'node[kind = "page"]', (event) => {
  simulation.hold(event.target.id(), event.target.position())
})
cy.on("dragfree", 'node[kind = "page"]', (event) => {
  simulation.drop(event.target.id())
  startMotion(() => simulation.nudge())
})

relayoutButton.addEventListener("click", () => {
  if (simulation.isRunning()) {
    simulation.stop()
    return
  }
  applyFilters({ replace: true })
})

renderRelayoutButton()

// --- 起動と watch ---

const showError = (message) => {
  const box = document.createElement("p")
  box.className = "canvas__message"
  box.textContent = message
  canvasArea.append(box)
}

const load = async () => {
  const response = await fetch("/api/graph")
  if (!response.ok) throw new Error(`走査に失敗しました（${response.status}）`)
  return response.json()
}

load()
  .then(update)
  .catch((error) => showError(String(error.message ?? error)))

// `.svx` の保存を dev サーバーが検知して、再走査した結果を push してくる。
if (import.meta.hot) {
  import.meta.hot.on(UPDATE_EVENT, update)
}
