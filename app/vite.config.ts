import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"
import { sveltekit } from "@sveltejs/kit/vite"
import { enhancedImages } from "@sveltejs/enhanced-img"
import yaml from "@modyfi/vite-plugin-yaml"

export default defineConfig({
  define: {
    __GITHUB_PAGES__: JSON.stringify(process.env.GITHUB_PAGES === "true")
  },
  plugins: [enhancedImages(), yaml(), sveltekit()],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }]
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"]
        }
      },

      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"]
        }
      }
    ]
  }
})
