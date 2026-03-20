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

export default function remarkGuideDirectives(
  directives: DirectiveConfigMap
): (tree: import("mdast").Root) => void
