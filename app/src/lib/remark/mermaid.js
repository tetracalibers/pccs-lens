// @ts-check
import { visit } from "unist-util-visit"
import { renderMermaidSVG, THEMES } from "beautiful-mermaid"

/**
 * remark plugin that converts ```mermaid code blocks into inline SVGs at build time.
 * Uses beautiful-mermaid's renderMermaidSVG (synchronous, no DOM required).
 */
export default function remarkMermaid() {
  return (/** @type {import("mdast").Root} */ tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid") return
      if (!parent || index === null || index === undefined) return

      const svg = renderMermaidSVG(node.value, {
        ...THEMES["nord-light"],
        transparent: true,
        font: "'Zen Kaku Gothic Antique', sans-serif",
        nodeSpacing: 30,
        layerSpacing: 50,
        padding: 20
      })

      parent.children.splice(index, 1, {
        type: "html",
        value: `<figure class="mermaid-diagram">${svg}</figure>`
      })
    })
  }
}
