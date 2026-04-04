// @ts-check

import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"
import { fileURLToPath } from "url"
import remarkBreaks from "remark-breaks"
import remarkDirective from "./src/lib/remark/directive.js"
import remarkCustomDirectives from "./src/lib/remark/custom-directives.js"
import remarkMermaid from "./src/lib/remark/mermaid.js"

const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('./src/lib/remark/custom-directives.js').DirectiveConfigMap} */
const directives = {
  container: [
    { name: "Tips", replaceTo: "svelte-component" },
    { name: "Example", replaceTo: "svelte-component" },
    { name: "CardGrid", replaceTo: "svelte-component" },
    { name: "TermCard", replaceTo: "svelte-component" }
  ],
  leaf: [{ name: "ComingSoon", replaceTo: "svelte-component" }],
  text: [
    { name: "Mark", replaceTo: "svelte-component" },
    { name: "GradeTag", replaceTo: "svelte-component" },
    { name: "PageLink", replaceTo: "svelte-component" },
    { name: "MoreToCome", replaceTo: "svelte-component" },
    { name: "WithGradeTag", replaceTo: "svelte-component" }
  ]
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ fallback: "404.html" }),
    paths: { base: isGithubPages ? "/pccs-lens" : "" }
  },
  preprocess: [
    mdsvex({
      layout: {
        "guide-map": fileURLToPath(new URL("./src/lib/layouts/guide-map.svelte", import.meta.url)),
        "guide-content": fileURLToPath(
          new URL("./src/lib/layouts/guide-content.svelte", import.meta.url)
        )
      },
      // @ts-ignore
      remarkPlugins: [
        remarkBreaks,
        remarkDirective,
        [remarkCustomDirectives, directives],
        remarkMermaid
      ]
    })
  ],
  extensions: [".svelte", ".svx"]
}

export default config
