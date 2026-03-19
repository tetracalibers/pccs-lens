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
 *   :mark[text]           → <span class="mark -brackets">text</span>
 *   :::tips\n...\n:::     → <div class="tips">...</div>
 *   :::example\n...\n:::  → <div class="example">...</div>
 *   :::color-card\n...\n::: → <div class="color-type-card">...</div>
 *   :::color-grid\n...\n::: → <div class="color-type-grid">...</div>
 *
 * Nesting:
 *   The directive regex uses a negative lookahead to match only "leaf" directives
 *   (those whose content contains no nested :::word blocks). Running the
 *   replacement in a loop processes inner directives first, then outer ones.
 *
 *   Regex breakdown:
 *     :::([\w-]+)\n          opening fence with name
 *     ((?:(?!:::[\w-])[\s\S])*?)  content: any char that is NOT the start of :::word
 *     \n:::(?![\w-])         closing fence: ::: not followed by a word char
 */

const CLASS_MAP: Record<string, string> = {
  "color-grid": "color-type-grid",
  "color-card": "color-type-card",
  tips: "tips",
  example: "example",
}

/**
 * Converts backtick code spans to <code> elements.
 * Needed inside HTML blocks where mdsvex won't apply inline markdown processing.
 */
const inlineCode = (s: string) => s.replace(/`([^`]+)`/g, "<code>$1</code>")

/**
 * Converts the content of a :::color-card block into HTML.
 * Blocks (separated by blank lines) are classified as:
 *   - ### heading → <h3>
 *   - line starting with < → Svelte component / HTML, passed through as-is
 *   - anything else → <p>
 */
function processCardContent(content: string): string {
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks
    .map((block) => {
      if (block.startsWith("###")) {
        return `<h3>${block.replace(/^###\s*/, "")}</h3>`
      }
      if (block.startsWith("<")) {
        return block
      }
      return `<p>${inlineCode(block)}</p>`
    })
    .join("\n")
}

// Matches a leaf directive: :::name where the content contains no :::word
const LEAF_DIRECTIVE_RE = /:::([\w-]+)\n((?:(?!:::[\w-])[\s\S])*?)\n:::(?![\w-])/g

export function svxDirectives() {
  return {
    name: "svx-directives",
    markup({ content, filename }: { content: string; filename?: string }) {
      if (!filename?.endsWith(".svx")) return

      // Step 1: :mark[content] → <span class="mark -brackets">content</span>
      let code = content.replace(/:mark\[([^\]]+)\]/g, (_, inner) => {
        return `<span class="mark -brackets">${inlineCode(inner)}</span>`
      })

      // Step 2: process directives innermost-first by repeating until stable
      let prev = ""
      while (prev !== code) {
        prev = code
        code = code.replace(LEAF_DIRECTIVE_RE, (_, name, inner) => {
          const cls = CLASS_MAP[name] ?? name
          const trimmed = inner.trim()

          if (name === "color-card") {
            return `<div class="${cls}">\n${processCardContent(trimmed)}\n</div>`
          }
          if (name === "color-grid") {
            return `<div class="${cls}">\n${trimmed}\n</div>`
          }
          // tips, example: single-paragraph content
          return `<div class="${cls}">${inlineCode(trimmed)}</div>`
        })
      }

      return { code }
    },
  }
}
