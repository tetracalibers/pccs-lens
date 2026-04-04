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

      const isComponent = directive.name[0] === directive.name[0].toUpperCase()
      const config = directives[typeKey].find((d) => d.name === directive.name)

      if (isComponent && config?.replaceTo === "svelte-component") {
        directive.data = {
          ...directive.data,
          hName: directive.name,
          hProperties: directive.attributes
        }
        return
      }

      const classes = (() => {
        const configClasses = config && config.replaceTo === "html" ? config.classes : []
        const directiveClasses = directive.attributes?.class
          ? directive.attributes.class.split(" ")
          : []
        return [...configClasses, ...directiveClasses]
      })()

      directive.data = {
        ...directive.data,
        hName: directive.name,
        hProperties: { ...directive.attributes, class: classes.join(" ") }
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
