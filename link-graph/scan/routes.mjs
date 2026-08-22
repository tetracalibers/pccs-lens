// ルートの列挙と、リンク先（href）の解決。

import fs from "node:fs"
import path from "node:path"
import { ROUTES_DIR } from "./config.mjs"

/**
 * SvelteKit のルートディレクトリを再帰的に辿って `+page.svx` / `+page.svelte` を集める。
 *
 * @returns {{ svx: { file: string, route: string }[], svelte: { file: string, route: string }[] }}
 */
export const collectRoutes = () => {
  /** @type {{ file: string, route: string }[]} */
  const svx = []
  /** @type {{ file: string, route: string }[]} */
  const svelte = []

  /**
   * @param {string} dir
   * @param {string[]} segments
   */
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort(byName)) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // グループディレクトリ `(name)` は URL に現れない。
        const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")")
        walk(full, isGroup ? segments : [...segments, entry.name])
        continue
      }

      const route = segments.length ? `/${segments.join("/")}/` : "/"
      if (entry.name === "+page.svx") svx.push({ file: full, route })
      if (entry.name === "+page.svelte") svelte.push({ file: full, route })
    }
  }

  walk(ROUTES_DIR, [])
  return { svx, svelte }
}

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

/** ルート文字列をセグメント配列にする（`"/cg/basics/"` → `["cg", "basics"]`）。 */
const toSegments = (route) => route.split("/").filter(Boolean)

/**
 * `+page.svelte` のルートを、動的セグメント（`[slug]`）を含むパターンとして扱えるようにする。
 *
 * `/cg/basics/` のような一覧ページは `app/src/routes/cg/[slug]/+page.svelte` が受けるので、
 * 静的なルート一覧との単純比較では「リンク切れ」に見えてしまう。
 *
 * @param {{ route: string }[]} svelteRoutes
 * @returns {(route: string) => boolean}
 */
export const createSvelteRouteMatcher = (svelteRoutes) => {
  const patterns = svelteRoutes.map(({ route }) => toSegments(route))

  return (route) => {
    const segments = toSegments(route)
    return patterns.some(
      (pattern) =>
        pattern.length === segments.length &&
        pattern.every(
          (part, index) => (part.startsWith("[") && part.endsWith("]")) || part === segments[index]
        )
    )
  }
}

/**
 * リンクの href をルートに正規化する。アンカー・クエリを落とし、末尾スラッシュを付ける。
 *
 * @param {string} href
 * @returns {string}
 */
export const normalizeHref = (href) => {
  const withoutFragment = href.split("#")[0].split("?")[0]
  const segments = toSegments(withoutFragment)
  return segments.length ? `/${segments.join("/")}/` : "/"
}
