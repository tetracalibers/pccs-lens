import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"
import { sveltekit } from "@sveltejs/kit/vite"
import { enhancedImages } from "@sveltejs/enhanced-img"
import yaml from "@modyfi/vite-plugin-yaml"

// Cloudflare Workers Builds は WORKERS_CI=1 と、ビルド対象ブランチ名を WORKERS_CI_BRANCH に注入する。
// main ブランチのビルドのみ本番扱いとし、PR/プレビュービルドでは draft を表示したままにする。
const isCloudflareMainBuild =
  process.env.WORKERS_CI === "1" && process.env.WORKERS_CI_BRANCH === "main"

export default defineConfig({
  define: {
    // 本番ビルド（Cloudflare main）でのみ draft ページを隠す。
    __PRODUCTION__: JSON.stringify(isCloudflareMainBuild)
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
