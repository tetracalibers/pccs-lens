import { defineConfig } from "vite"
import { linkGraphPlugin } from "./scan/plugin.mjs"

export default defineConfig({
  plugins: [linkGraphPlugin()],
  server: {
    // app の dev サーバー（5173）と同時に立ち上げるので、別のポートに固定する。
    port: 5174,
    strictPort: true
  }
})
