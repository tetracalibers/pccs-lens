// 画面の組み立て。走査結果の取得 → グラフの同期 → フィルタ適用 → シミュレーション、
// という流れを回す。
//
// 配置は d3-force のシミュレーションが持ち、毎フレームその座標を Cytoscape へ流し込む
// （`pumpPositions`）。囲みはノードの position イベントを見て BubbleSets が追従する。
//
// **配置のアニメーションは見せない。** 初回ロード・「再配置」・表示項目の増減のいずれも、裏で
// 解き切ってから結果だけを描く（配置が決まるまでのチラつきを避けるため）。動くのはノードを
// ドラッグして離したあとの揺り戻しだけ。走査やフィルタのたびに全体が泳ぐと「さっき見ていた赤が
// どこへ行ったか」が追えなくなるので、再走査時は既存ノードを固定して増えた分だけを落ち着かせる。

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

/** パス → 走査結果のノード。サイドパネルの引き回しに使う。 */
let nodeIndex = new Map()

/** id → 走査結果のエッジ。シミュレーションのリンクを作るのに使う。 */
let edgeIndex = new Map()

/** 自己リンクを持つページのパス。ヘッダーの「自己リンク」での絞り込みに使う。 */
let selfLinkPaths = new Set()

/**
 * ヘッダーのチップでの絞り込み（`broken` / `empty` / `draft` / `published` / `self-link`）。
 *
 * 空なら絞り込みなし。複数選ぶと OR（どれかに該当すれば残る）。**配置には触らない** —
 * シミュレーションのノードも囲みもそのままで、該当しないノードとその線だけを隠す。
 */
const stateFocus = new Set()

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

/** 画面に出ているか（フィルタでもチップの絞り込みでも隠れていないか）。 */
const isShown = (element) => !element.hasClass("hidden") && !element.hasClass("filtered-out")

const fitVisible = () => {
  const visible = cy.elements().filter(isShown)
  if (visible.nonempty()) cy.fit(visible, 60)
}

const simulation = createSimulation({
  onTick: pumpPositions,
  onSettle: () => {
    pumpPositions()
    // 間引かれて描き残っていた囲みを、最後の形で描き直す。
    hulls.update()
    cy.nodes().removeClass("no-label")
    renderRelayoutButton()
    updateFocus()
  }
})

/** シミュレーションを動かす（ドラッグの揺り戻しだけ）。動いている間はラベルを落とす。 */
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
    ? "揺り戻しを止めて、いまの配置で固定する"
    : "ユニットの中心から配置し直す"
}

/**
 * ヘッダーのチップを 1 つ作る。
 *
 * `focus` を持つチップは絞り込みのトグルにする。**素のチェックボックス + label** で組み、
 * 見た目だけ CSS でピルにしている（`aria-pressed` を付けたボタンではなく、ネイティブの
 * トグルとして読み上げ・キーボード操作が効くようにするため）。
 */
const renderChip = ({ label, value, modifier, focus, title }) => {
  const className = `stat${modifier ? ` stat--${modifier}` : ""}`

  const count = document.createElement("span")
  count.className = "stat__value"
  count.textContent = String(value)

  if (!focus) {
    const wrapper = document.createElement("span")
    wrapper.className = className
    if (title) wrapper.title = title
    wrapper.append(document.createTextNode(label), count)
    return wrapper
  }

  const wrapper = document.createElement("span")
  wrapper.className = `${className} stat--toggle`

  const input = document.createElement("input")
  input.type = "checkbox"
  input.className = "stat__checkbox"
  input.id = `stat-focus-${focus}`
  input.checked = stateFocus.has(focus)
  input.addEventListener("change", () => {
    if (input.checked) stateFocus.add(focus)
    else stateFocus.delete(focus)
    applyStateFocus()
  })

  const text = document.createElement("label")
  text.className = "stat__label"
  text.htmlFor = input.id
  text.title = title ?? `${label}のページだけを表示する（配置は動かない）`
  text.append(document.createTextNode(label), count)

  wrapper.append(input, text)
  return wrapper
}

const renderStats = () => {
  const { stats } = data
  const chips = [
    { label: "ページ", value: stats.pages },
    { label: "本文なし", value: stats.empty, modifier: "empty", focus: "empty" },
    { label: "draft", value: stats.draft, modifier: "draft", focus: "draft" },
    { label: "公開済", value: stats.published, focus: "published" },
    { label: "リンク切れ", value: stats.broken, modifier: "broken", focus: "broken" },
    { label: "リンク", value: stats.rawLinks },
    { label: "エッジ", value: stats.edges }
  ]

  statsElement.replaceChildren()

  for (const chip of chips) statsElement.append(renderChip(chip))

  for (const warning of [
    {
      label: "所属不明",
      value: stats.unresolvedUnits,
      modifier: "warn",
      title: "YAML に未登録で、所属ユニットが解決できないページ"
    },
    {
      label: "自己リンク",
      value: stats.selfLinks.length,
      modifier: "warn",
      focus: "self-link",
      title: `自己リンクのあるページだけを表示する（配置は動かない）\n${stats.selfLinks
        .map((link) => `${link.path} L${link.line}`)
        .join("\n")}`
    }
  ]) {
    if (!warning.value) continue
    statsElement.append(renderChip(warning))
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

/**
 * ヘッダーのチップでの絞り込みを反映する。
 *
 * 隠すのは表示だけで、シミュレーションのノードからは外さない（座標を保つため）。囲みも
 * そのまま残す — メンバーが隠れても輪郭は動かないので、「どのユニットのどこに居たか」の
 * 手がかりになる。
 */
const applyStateFocus = () => {
  const matches = (node) => {
    if (stateFocus.size === 0) return true
    if (stateFocus.has(node.data("state"))) return true
    return stateFocus.has("self-link") && selfLinkPaths.has(node.id())
  }

  cy.batch(() => {
    for (const node of cy.nodes().toArray()) {
      node.toggleClass("filtered-out", !matches(node))
    }
    // 端点のどちらかが隠れた線は出さない。
    for (const edge of cy.edges().toArray()) {
      edge.toggleClass(
        "filtered-out",
        edge.source().hasClass("filtered-out") || edge.target().hasClass("filtered-out")
      )
    }
  })

  updateFocus()
}

/** 選択中のノードの周辺だけを浮かせる。 */
const updateFocus = () => {
  cy.batch(() => {
    cy.elements().removeClass("faded focus-labeled highlighted")
    cy.nodes().unselect()

    if (!selectedPath) return
    const node = cy.$id(selectedPath)
    if (node.empty() || !isShown(node)) return

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
    if (node.nonempty() && isShown(node)) {
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

  // 初回と「再配置」はユニットの中心から解き直し、それ以外は増えた分だけを落ち着かせる。
  // どちらもアニメーションは見せず、裏で解き切ってから結果だけを描く。
  if (fromScratch) simulation.solve()
  else if (added > 0) simulation.settle()

  // 固定は次のドラッグのために外しておく（揺り戻しに周りが反応できるように）。
  simulation.unpin()

  pumpPositions()
  hulls.sync(hullMembers(plan))
  hulls.update()

  if (fromScratch) {
    fitVisible()
    isFirstLoad = false
  }

  applyStateFocus()
}

/** 走査結果を受け取って画面全体を更新する。 */
const update = (next) => {
  data = next
  nodeIndex = new Map(data.nodes.map((node) => [node.id, node]))
  edgeIndex = new Map(data.edges.map((edge) => [edge.id, edge]))
  selfLinkPaths = new Set(data.stats.selfLinks.map((link) => link.path))
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
