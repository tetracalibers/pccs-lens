// @ts-check
import { visit } from "unist-util-visit"

/**
 * @typedef {import("mdast").Root} Root
 * @typedef {import("mdast").Html} Html
 */

/**
 * @param {string} str
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * remark plugin: ` ```{lang}:{title} ` 形式のコードブロックを
 * <figure> でラップした「タイトル付きコードブロック」の HTML ノードに置換する。
 *
 * 例:
 *   ```math:緑と青の混色光に対する反応
 *   (L, M, S) = (中, 大, 大)
 *   ```
 *
 * 出力:
 *   <figure class="code-with-title">
 *     <figcaption>緑と青の混色光に対する反応</figcaption>
 *     <pre><code class="language-math">(L, M, S) = (中, 大, 大)</code></pre>
 *   </figure>
 *
 * mdsvex 0.12 では本プラグインは `apply_plugins(remarkPlugins, ...)` の中で走り、
 * 続く `highlight_blocks` (svelte.config.js で `highlight: false` 指定) は何もしない。
 * mdsvex 内部の `escape_code` が remark パイプライン前段で走るため、
 * node.value 内の `<>{}` は既にエンティティ化済み（再エスケープしない）。
 */
export default function remarkCodeTitle() {
  return (/** @type {Root} */ tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (!parent || index === null || index === undefined) return
      const rawLang = node.lang
      if (!rawLang || !rawLang.includes(":")) return
      const sepIndex = rawLang.indexOf(":")
      const realLang = rawLang.slice(0, sepIndex)
      const title = escapeHtml(rawLang.slice(sepIndex + 1))
      const langClass = realLang ? ` class="language-${realLang}"` : ""
      const html =
        `<figure class="code-with-title">` +
        `<figcaption>${title}</figcaption>` +
        `<pre${langClass}><code${langClass}>${node.value}</code></pre>` +
        `</figure>`
      parent.children.splice(index, 1, /** @type {Html} */ ({ type: "html", value: html }))
    })
  }
}
