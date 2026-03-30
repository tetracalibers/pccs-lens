// @ts-check

import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"
import { fileURLToPath } from "url"
import remarkBreaks from "remark-breaks"
import remarkDirective from "./src/lib/remark/directive.js"
import remarkCustomDirectives from "./src/lib/remark/custom-directives.js"

const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('./src/lib/remark/custom-directives.js').DirectiveConfigMap} */
const directives = {
  container: [
    { name: "Tips", replaceTo: "svelte-component" },
    { name: "Example", replaceTo: "svelte-component" },
    { name: "CardGrid", replaceTo: "svelte-component" },
    { name: "TermCard", replaceTo: "svelte-component" }
  ],
  leaf: [],
  text: [{ name: "Mark", replaceTo: "svelte-component" }]
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
        guide: fileURLToPath(new URL("./src/lib/layouts/guide.svelte", import.meta.url))
      },
      // @ts-ignore
      remarkPlugins: [remarkBreaks, remarkDirective, [remarkCustomDirectives, directives]]
    })
  ],
  extensions: [".svelte", ".svx"]
}

export default config
