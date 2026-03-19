import { visit } from "unist-util-visit"
import type { Root } from "mdast"
import type { Directives } from "mdast-util-directive"

export type DirectiveConfig = {
  name: string
  tag: string
  classes: string[]
}
export type DirectiveConfigMap = {
  container: DirectiveConfig[]
  leaf: DirectiveConfig[]
  text: DirectiveConfig[]
}

/**
 * remark plugin to transform custom directives into HTML elements with classes.
 */
export default function remarkGuideDirectives(directives: DirectiveConfigMap) {
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
