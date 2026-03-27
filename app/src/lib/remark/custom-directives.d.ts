export type DirectiveConfig =
  | {
      replaceTo: "html"
      name: string
      tag: string
      classes: string[]
    }
  | {
      replaceTo: "svelte-component"
      name: string
    }
export type DirectiveConfigMap = {
  container: DirectiveConfig[]
  leaf: DirectiveConfig[]
  text: DirectiveConfig[]
}

export default function remarkGuideDirectives(
  directives: DirectiveConfigMap
): (tree: import("mdast").Root) => void
