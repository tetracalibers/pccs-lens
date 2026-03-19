/**
 * Svelte markup preprocessor that transforms directive syntax in .svx files
 * into HTML elements before mdsvex processes the file.
 *
 * Background: remark-directive v4 uses micromark extensions to extend the
 * markdown parser, but mdsvex 0.12.x bundles its own old remark-parse that
 * does not use micromark. As a result, remarkPlugins cannot hook into the
 * parsing step, and directive syntax is never recognized.
 * Running this preprocessor before mdsvex avoids that limitation entirely.
 *
 * Supported directives:
 *   :mark[text]          → <span class="mark -brackets">text</span>
 *   :::tips\n...\n:::    → <div class="tips">...</div>
 *   :::example\n...\n::: → <div class="example">...</div>
 */
export function svxDirectives() {
  return {
    name: "svx-directives",
    markup({ content, filename }: { content: string; filename?: string }) {
      if (!filename?.endsWith(".svx")) return

      // Convert backtick spans to <code> (needed inside HTML blocks
      // where mdsvex won't apply inline markdown processing)
      const inlineCode = (s: string) => s.replace(/`([^`]+)`/g, "<code>$1</code>")

      // :mark[content] → <span class="mark -brackets">content</span>
      // Handles inline code inside brackets as well
      let code = content.replace(/:mark\[([^\]]+)\]/g, (_, inner) => {
        return `<span class="mark -brackets">${inlineCode(inner)}</span>`
      })

      // :::name\ncontent\n::: → <div class="name">content</div>
      // Inner content has inline code converted since it lands in an HTML block
      code = code.replace(/:::(\w+)\n([\s\S]+?)\n:::/g, (_, name, inner) => {
        return `<div class="${name}">${inlineCode(inner.trim())}</div>`
      })

      return { code }
    },
  }
}
