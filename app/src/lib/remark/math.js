// @ts-check
import { visit } from "unist-util-visit"
import katex from "katex"

/**
 * @typedef {import("mdast").Root} Root
 * @typedef {import("mdast").Paragraph} Paragraph
 * @typedef {import("mdast").Html} Html
 */

/** @type {import("katex").KatexOptions} */
const KATEX_OPTIONS = { throwOnError: false, output: "html" }

const BLOCK_MATH_RE = /^\$\$\s*([^$]+?)\s*\$\$$/
const INLINE_MATH_RE = /\$\$([^$]+?)\$\$/g

/**
 * @param {string} latex
 */
function renderDisplay(latex) {
  return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: true })
}

/**
 * @param {string} latex
 */
function renderInline(latex) {
  return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: false })
}

/**
 * linkReference / imageReference ノードの子テキストを取り出す。
 * @param {{ children?: Array<{ type: string; value?: string }> }} node
 */
function referenceLabel(node) {
  let text = ""
  for (const child of node.children ?? []) {
    if (typeof child.value === "string") text += child.value
  }
  return text
}

/**
 * `$$[R]$$` のように数式中に角括弧があると、CommonMark がそれを linkReference として
 * パースし text ノードを分断してしまう（このリポジトリには参照リンク定義は存在しない）。
 * 数式マッチングの前に linkReference をリテラルな `[ラベル]` テキストに戻し、隣接する
 * text ノードを結合して、`$$...$$` が 1 つの text ノードに収まるようにする。
 * @param {Root} tree
 */
function restoreBracketsAndMergeText(tree) {
  visit(tree, (/** @type {any} */ node) => {
    if (!Array.isArray(node.children)) return
    /** @type {any[]} */
    const merged = []
    for (const child of node.children) {
      let next = child
      if (child.type === "linkReference") {
        const label = referenceLabel(child)
        let raw = `[${label}]`
        if (child.referenceType === "collapsed") raw += "[]"
        else if (child.referenceType === "full") raw += `[${child.label ?? ""}]`
        next = { type: "text", value: raw }
      }
      const last = merged[merged.length - 1]
      if (next.type === "text" && last && last.type === "text") {
        last.value += next.value
      } else {
        merged.push(next)
      }
    }
    node.children = merged
  })
}

/**
 * 段落の children が text と break のみで構成されている場合、生のテキスト表現を返す。
 * それ以外（リンクや強調などのインライン要素を含む）の場合は null を返す。
 * @param {Paragraph} node
 * @returns {string | null}
 */
function paragraphRawText(node) {
  let text = ""
  for (const child of node.children) {
    if (child.type === "text") text += child.value
    else if (child.type === "break") text += "\n"
    else return null
  }
  return text
}

/**
 * remark plugin: $$...$$ をビルド時に KaTeX でレンダして HTML ノードに置換する。
 * - 段落全体が $$...$$ → display モード
 * - text ノード内の $$...$$ → inline モード
 * ```math コードブロックは触らない
 *
 * mdsvex 0.12 のバンドル済み unified v9 パイプラインは data.micromarkExtensions を
 * 読まないため、remark-math@6 が機能しない。本プラグインは AST トランスフォーマとして
 * 動作するためバージョンに依存しない。
 */
export default function remarkMath() {
  return (/** @type {Root} */ tree) => {
    restoreBracketsAndMergeText(tree)

    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === null || index === undefined) return
      const text = paragraphRawText(node)
      if (text === null) return
      const match = text.trim().match(BLOCK_MATH_RE)
      if (!match) return
      const html = renderDisplay(match[1].trim())
      parent.children.splice(
        index,
        1,
        /** @type {Html} */ ({
          type: "html",
          value: `<figure class="math-display">${html}</figure>`
        })
      )
    })

    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === null || index === undefined) return
      if (!node.value.includes("$$")) return
      /** @type {Array<import("mdast").PhrasingContent | Html>} */
      const parts = []
      let lastIndex = 0
      const re = new RegExp(INLINE_MATH_RE.source, "g")
      let match
      while ((match = re.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: "text", value: node.value.slice(lastIndex, match.index) })
        }
        const html = renderInline(match[1])
        parts.push(
          /** @type {Html} */ ({
            type: "html",
            value: `<span class="math-inline">${html}</span>`
          })
        )
        lastIndex = re.lastIndex
      }
      if (parts.length === 0) return
      if (lastIndex < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(lastIndex) })
      }
      parent.children.splice(index, 1, .../** @type {any} */ (parts))
      return index + parts.length
    })
  }
}
