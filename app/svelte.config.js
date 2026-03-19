import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"
import { fileURLToPath } from "url"
import remarkDirective from "./src/lib/remark/directive.ts"
import { remarkGuideDirectives } from "./src/lib/remark/custom-directives.ts"

const isGithubPages = process.env.GITHUB_PAGES === "true"

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
      remarkPlugins: [remarkDirective, remarkGuideDirectives]
    })
  ],
  extensions: [".svelte", ".svx"]
}

export default config
