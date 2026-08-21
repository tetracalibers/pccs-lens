// サイドパネル。ノードを選んだときに、そのページへのリンク・そのページが含むリンク・記事へのリンクを出す。
//
// 赤いノードを見つけたあとに知りたいのは「どの記事から、どんな文脈で必要とされているか」なので、
// 「このページへのリンク」を先に置き、リンク文言（アンカーテキスト）と行番号も添える。

import { APP_DEV_ORIGIN, STATE_COLORS } from "./theme.js"

const STATE_LABELS = {
  empty: "本文なし",
  draft: "draft",
  published: "公開済",
  broken: "リンク切れ"
}

const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const badge = (text, modifier) =>
  element("span", `badge${modifier ? ` badge--${modifier}` : ""}`, text)

/**
 * リンク一覧の 1 行。クリックでそのノードへ移る。
 *
 * @param {{ path: string, occurrences: { text: string, line: number }[] }} entry
 * @param {Map<string, object>} nodeById
 * @param {(path: string) => void} onNavigate
 */
const linkRow = (entry, nodeById, onNavigate) => {
  const node = nodeById.get(entry.path)
  const item = element("li", "link-list__item")

  const button = element("button", "link-list__button")
  button.type = "button"
  button.addEventListener("click", () => onNavigate(entry.path))

  const title = element("span", "link-list__title")
  const dot = element("span", "link-list__dot")
  dot.style.background = STATE_COLORS[node?.state ?? "published"]
  title.append(dot, element("span", null, node?.title ?? entry.path))
  button.append(title)

  if (entry.occurrences.length) {
    const anchors = element("div", "link-list__anchors")
    for (const occurrence of entry.occurrences) {
      anchors.append(
        element(
          "span",
          "link-list__anchor",
          `${occurrence.text || "（文言なし）"} · L${occurrence.line}`
        )
      )
    }
    button.append(anchors)
  }

  item.append(button)
  return item
}

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {object | null} options.node 走査結果のノード（未選択なら null）
 * @param {Map<string, object>} options.nodeById
 * @param {Map<string, string>} options.unitLabels ユニット id → 表示名
 * @param {Map<string, string>} options.groupLabels 大分類 id → 表示名
 * @param {(path: string) => void} options.onNavigate
 */
export const renderPanel = (container, { node, nodeById, unitLabels, groupLabels, onNavigate }) => {
  container.replaceChildren()

  if (!node) {
    container.append(
      element(
        "p",
        "panel__placeholder",
        "ノードをクリックすると、そのページのリンクの出入りが出ます。"
      )
    )
    return
  }

  container.append(element("h2", "panel__title", node.title))
  container.append(element("p", "panel__path", node.path))

  const badges = element("div", "panel__badges")
  badges.append(badge(STATE_LABELS[node.state] ?? node.state, node.state))
  if (node.group) badges.append(badge(groupLabels.get(node.group) ?? node.group))
  if (node.unit) badges.append(badge(unitLabels.get(node.unit) ?? node.unit))
  if (node.warning === "unit-unresolved") badges.append(badge("所属不明（YAML 未登録）", "draft"))
  if (node.isolated) badges.append(badge("孤立"))
  container.append(badges)

  if (node.state !== "broken") {
    const open = element("a", "panel__open", "記事を開く ↗")
    open.href = `${APP_DEV_ORIGIN}${node.path}`
    open.target = "_blank"
    open.rel = "noreferrer"
    container.append(open)
  }

  for (const section of [
    {
      heading: `このページへのリンク（${node.inDegree}）`,
      entries: node.inbound,
      empty: "どこからもリンクされていません。"
    },
    {
      heading: `このページが含むリンク（${node.outDegree}）`,
      entries: node.outbound,
      empty: "どこへもリンクしていません。"
    }
  ]) {
    const block = element("section", "panel__section")
    block.append(element("h3", "panel__heading", section.heading))

    if (section.entries.length === 0) {
      block.append(element("p", "panel__empty", section.empty))
    } else {
      const list = element("ul", "link-list")
      for (const entry of section.entries) list.append(linkRow(entry, nodeById, onNavigate))
      block.append(list)
    }

    container.append(block)
  }
}
