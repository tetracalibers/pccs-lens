import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"
import { fileURLToPath } from "url"
import { svxDirectives } from "./src/lib/preprocessors/svx-directives.ts"

const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ fallback: "404.html" }),
    paths: { base: isGithubPages ? "/pccs-lens" : "" }
  },
  preprocess: [
    svxDirectives(),
    mdsvex({
      layout: {
        guide: fileURLToPath(new URL("./src/lib/layouts/guide.svelte", import.meta.url))
      }
    })
  ],
  extensions: [".svelte", ".svx"]
}

export default config
