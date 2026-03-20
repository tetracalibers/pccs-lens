import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"
import { fileURLToPath } from "url"
import remarkBreaks from "remark-breaks"
import remarkDirective from "./src/lib/remark/directive.js"
import remarkGuideDirectives from "./src/lib/remark/custom-directives.js"

const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('./src/lib/remark/custom-directives.js').DirectiveConfigMap} */
const guideDirectives = {
  container: [
    { name: "tips", tag: "div", classes: ["tips"] },
    { name: "example", tag: "div", classes: ["example"] },
    { name: "term-grid", tag: "div", classes: ["term-grid"] },
    { name: "term-card", tag: "div", classes: ["term-card"] }
  ],
  leaf: [],
  text: [{ name: "mark", tag: "span", classes: ["mark", "-brackets"] }]
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
        guide: fileURLToPath(new URL("./src/lib/layouts/guide.svelte", import.meta.url))
      },
      remarkPlugins: [remarkBreaks, remarkDirective, [remarkGuideDirectives, guideDirectives]]
    })
  ],
  extensions: [".svelte", ".svx"]
}

export default config
