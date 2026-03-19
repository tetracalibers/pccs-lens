import { fromMarkdown } from "mdast-util-from-markdown"
import { directive } from "micromark-extension-directive"
import { directiveFromMarkdown } from "mdast-util-directive"
import { frontmatter } from "micromark-extension-frontmatter"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import type { Processor } from "unified"
import type { Node } from "unist"

export default function remarkDirective(this: Processor) {
  // mdsvex bundles an old unified that only reads `this.Parser` (uppercase).
  // Using `this.parser` (the non-deprecated form) breaks directive parsing
  // because mdsvex never picks it up. Suppress the deprecation warning here.
  this.Parser = function (doc: string) {
    // fromMarkdown (CommonMark) cannot parse Svelte component attributes that
    // use {expr} syntax — it fails to recognize the tag as HTML and wraps it
    // in a <p>, causing a Svelte compile error on the " inside {[...]}.
    //
    // Fix: stash every self-closing component line before parsing, replace it
    // with a plain <div> HTML block that fromMarkdown preserves as-is, then
    // restore the originals after the AST is built.
    const stash: string[] = []

    const prepared = doc.replace(/^(<[A-Z][^\n]*\{[^\n]*\/>)\s*$/gm, (_, tag) => {
      const i = stash.length
      stash.push(tag)
      return `<div data-svx="${i}"></div>`
    })

    const tree = fromMarkdown(prepared, "utf-8", {
      extensions: [frontmatter(["yaml"]), directive()],
      mdastExtensions: [frontmatterFromMarkdown(["yaml"]), directiveFromMarkdown()]
    })

    if (stash.length > 0) restore(tree, stash)

    return tree
  }
}

function restore(node: Node, stash: string[]): void {
  const n = node as unknown as Record<string, unknown>
  if (n["type"] === "html" && typeof n["value"] === "string") {
    n["value"] = (n["value"] as string).replace(
      /<div data-svx="(\d+)"><\/div>/g,
      (_, i: string) => stash[+i]
    )
  }
  if (Array.isArray(n["children"])) {
    for (const child of n["children"] as Node[]) restore(child, stash)
  }
}
