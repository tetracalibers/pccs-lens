import { visit } from "unist-util-visit"

/**
 * remark plugin to transform custom directives into HTML elements with classes.
 * @param {import('./custom-directives.js').DirectiveConfigMap} directives
 */
export default function remarkGuideDirectives(directives) {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type !== "textDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "containerDirective"
      ) {
        return
      }
      const directive = node
      const classes = directive.attributes?.class ? directive.attributes.class.split(" ") : []
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
      const config = directives[typeKey].find((d) => d.name === directive.name)
      if (config) {
        directive.data = {
          hName: config.tag,
          hProperties: { class: [...config.classes, ...classes].join(" ") }
        }
      }
    })
  }
}
