import { mdsvex } from "mdsvex"
import adapter from "@sveltejs/adapter-static"

const isGithubPages = process.env.GITHUB_PAGES === "true"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ fallback: "404.html" }),
    paths: { base: isGithubPages ? "/pccs-lens" : "" }
  },
  preprocess: [mdsvex()],
  extensions: [".svelte", ".svx"]
}

export default config
