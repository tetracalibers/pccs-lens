// dev サーバー用の Vite プラグイン。
//
// - `/api/graph` … 走査結果（JSON）を返す
// - watch        … app 側の `+page.svx` とユニット定義 YAML の変更を検知して、
//                  再走査した結果を HMR のカスタムイベントでクライアントへ push する

import { CONTENT_PAGES_DIR, ROUTES_DIR } from "./config.mjs"
import { UPDATE_EVENT } from "./events.mjs"
import { scanGraph } from "./index.mjs"

/** 連続保存でまとめて走査するための待ち時間（ms）。 */
const DEBOUNCE_MS = 120

/** 再走査の対象となるファイル。 */
const isWatched = (file) => file.endsWith("+page.svx") || file.endsWith(".yaml")

/**
 * @returns {import("vite").Plugin}
 */
export const linkGraphPlugin = () => ({
  name: "link-graph",

  configureServer(server) {
    const respond = (res, status, body) => {
      res.statusCode = status
      res.setHeader("Content-Type", "application/json; charset=utf-8")
      res.setHeader("Cache-Control", "no-store")
      res.end(JSON.stringify(body))
    }

    server.middlewares.use("/api/graph", (_req, res) => {
      try {
        respond(res, 200, scanGraph())
      } catch (error) {
        server.config.logger.error(`[link-graph] 走査に失敗: ${error.stack ?? error}`)
        respond(res, 500, { error: String(error?.message ?? error) })
      }
    })

    // app は Vite のルート（link-graph/）の外にあるので、明示的に watch 対象へ加える。
    server.watcher.add([ROUTES_DIR, CONTENT_PAGES_DIR])

    /** @type {NodeJS.Timeout | null} */
    let timer = null

    const rescan = (file) => {
      if (!isWatched(file)) return

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        try {
          const graph = scanGraph()
          const hot = server.hot ?? server.ws
          hot.send({ type: "custom", event: UPDATE_EVENT, data: graph })
          server.config.logger.info(
            `[link-graph] 再走査: ${graph.stats.pages} ページ / ${graph.stats.edges} エッジ`
          )
        } catch (error) {
          server.config.logger.error(`[link-graph] 再走査に失敗: ${error.stack ?? error}`)
        }
      }, DEBOUNCE_MS)
    }

    for (const event of ["add", "change", "unlink"]) server.watcher.on(event, rescan)
  }
})
