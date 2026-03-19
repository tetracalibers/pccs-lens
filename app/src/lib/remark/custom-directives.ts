import { visit } from "unist-util-visit"
import type { Root } from "mdast"
import type { Directives } from "mdast-util-directive"

/**
 * remark plugin to transform custom directives into HTML elements with classes.
 *
 * Supported directives:
 *   :mark[text]          → <span class="mark -brackets">text</span>
 *   :::tips\n...\n:::    → <div class="tips">...</div>
 *   :::example\n...\n::: → <div class="example">...</div>
 */
export function remarkGuideDirectives() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        node.type !== "textDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "containerDirective"
      ) {
        return
      }
      const directive = node as unknown as Directives
      if (directive.type === "textDirective" && directive.name === "mark") {
        directive.data = {
          hName: "span",
          hProperties: { class: "mark -brackets" },
        }
      }
      if (directive.type === "containerDirective" || directive.type === "leafDirective") {
        if (directive.name === "tips") {
          directive.data = { hName: "div", hProperties: { class: "tips" } }
        }
        if (directive.name === "example") {
          directive.data = { hName: "div", hProperties: { class: "example" } }
        }
      }
    })
  }
}
