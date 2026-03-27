// @ts-check

import { visit } from "unist-util-visit"

/**
 * remark plugin to transform custom directives into HTML elements with classes.
 * @param {import('./custom-directives.js').DirectiveConfigMap} directives
 */
export default function remarkCustomDirectives(directives) {
  return (/** @type {import("mdast").Root} */ tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent) return
      if (index === null || index === undefined) return
      if (!isDirectiveNode(node)) return

      const directive = /** @type {import("mdast-util-directive").Directives} */ (node)
      const typeKey = (() => {
        switch (directive.type) {
          case "textDirective":
            return "text"
          case "leafDirective":
            return "leaf"
          case "containerDirective":
            return "container"
        }
      })()
      if (!typeKey) return

      const config = directives[typeKey].find((d) => d.name === directive.name)
      if (!config) return

      const isComponent = directive.name[0] === directive.name[0].toUpperCase()
      if (isComponent) {
        directive.data = {
          ...node.data,
          hName: directive.name,
          hProperties: Object.fromEntries(
            Object.entries(directive.attributes ?? {}).filter(([_k, v]) => Boolean(v))
          )
        }
      } else {
        if (config.replaceTo !== "html") return
        const classes = directive.attributes?.class ? directive.attributes.class.split(" ") : []

        directive.data = {
          ...node.data,
          hName: config.tag,
          hProperties: { class: [...config.classes, ...classes].join(" ") }
        }
      }
    })
  }
}

function isDirectiveNode(/** @type {import("unist").Node} */ node) {
  return (
    node.type === "containerDirective" ||
    node.type === "leafDirective" ||
    node.type === "textDirective"
  )
}
