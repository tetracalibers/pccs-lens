// @ts-check

import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"

/**
 * Remark plugin: h2/h3/h4 見出しのプレーンテキストを `title` プロップとして渡す。
 * mdastの heading ノードに data.hProperties.title をセットすると、
 * remark-rehype 変換後に HTML 属性として引き継がれ、
 * mdsvex が Svelte コンポーネントの title プロップに変換する。
 */
export default function remarkHeadingTitle() {
  return (/** @type {import("mdast").Root} */ tree) => {
    visit(tree, "heading", (node) => {
      if (node.depth < 2 || node.depth > 4) return
      const text = toString(node)
      const grades = extractGrades(node)
      node.data = node.data ?? {}
      const nodeData = /** @type {Record<string, unknown>} */ (node.data)
      const hProps = /** @type {Record<string, unknown>} */ (nodeData.hProperties ?? {})
      nodeData.hProperties = grades
        ? { ...hProps, title: text, grades }
        : { ...hProps, title: text }
    })
  }
}

/**
 * 見出しの children から WithGradeTag ディレクティブの grades 属性を抽出する。
 * @param {import("mdast").Heading} node
 * @returns {string | null}
 */
function extractGrades(node) {
  for (const child of node.children) {
    const directive = /** @type {any} */ (child)
    if (
      directive.type === "textDirective" &&
      directive.name === "WithGradeTag" &&
      directive.attributes?.grades
    ) {
      return directive.attributes.grades
    }
  }
  return null
}
