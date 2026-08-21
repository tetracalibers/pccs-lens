// 画面の組み立て。走査結果の取得 → グラフの同期 → フィルタ適用 → レイアウト、という流れを回す。

import { UPDATE_EVENT } from "../scan/events.mjs"
import { createFilters } from "./filters.js"
import {
  applyVisibility,
  computeVisibility,
  createGraph,
  syncElements,
  visibleCollection
} from "./graph.js"
import { runLayout } from "./layout.js"
import { renderPanel } from "./panel.js"
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

const cy = createGraph(canvas)

// --- 状態 ---

/** 直近の走査結果。 */
let data = null

/** ノードの座標の記憶。再走査・フィルタ変更のあとも位置を保つために持つ。 */
const savedPositions = new Map()

/** 選択中のノードのパス。再走査をまたいで保つ。 */
let selectedPath = null

/** 最初のレイアウトだけビューポートを合わせる（以降は勝手に動かさない）。 */
let needsFit = true

/** パス → 走査結果のノード。サイドパネルの引き回しに使う。 */
let nodeIndex = new Map()

const filters = createFilters(filtersElement, () => applyFilters())

// --- 描画 ---

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
    cy.nodes('[kind = "page"]').unselect()

    if (!selectedPath) return
    const node = cy.$id(selectedPath)
    if (node.empty() || node.hasClass("hidden")) return

    node.select()
    const neighborhood = node.closedNeighborhood()
    cy.elements().not('node[kind = "unit"]').difference(neighborhood).addClass("faded")
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

/** 現在のフィルタをグラフへ反映し、増減したノードだけを配置し直す。 */
const applyFilters = () => {
  const plan = computeVisibility(data, filters.state)
  const reparented = applyVisibility(cy, plan)

  // 親（囲み）が変わったノードは、前の座標に縛ると囲みの外へ引っぱられるので固定を外す。
  const pinned = new Map(
    [...savedPositions].filter(([id]) => !reparented.has(id) && plan.visibleNodes.has(id))
  )

  runLayout(visibleCollection(cy, plan), { pinned, fit: needsFit })
  needsFit = false

  for (const id of plan.visibleNodes) {
    savedPositions.set(id, { ...cy.$id(id).position() })
  }

  updateFocus()
}

/** 走査結果を受け取って画面全体を更新する。 */
const update = (next) => {
  data = next
  nodeIndex = new Map(data.nodes.map((node) => [node.id, node]))
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
