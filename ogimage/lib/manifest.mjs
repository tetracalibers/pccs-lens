// 生成済みルートのマニフェスト（app/src/lib/meta/og-manifest.json）を読み書きする。
// アプリ側の <SiteMeta> がこの JSON を import し、載っているルートは固有の og:image / og:title を、
// 無ければ既定画像・サイト名にフォールバックする。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

/**
 * @typedef {{ routes: Record<string, { title: string }> }} Manifest
 */

/**
 * マニフェストを読む。無ければ空の構造を返す。
 * @param {string} path
 * @returns {Manifest}
 */
export const readManifest = (path) => {
  try {
    const raw = readFileSync(path, "utf8")
    const data = JSON.parse(raw)
    return { routes: data.routes ?? {} }
  } catch {
    return { routes: {} }
  }
}

/**
 * ルートを追加/更新して書き出す（キー昇順・末尾改行あり）。冪等。
 * @param {string} path
 * @param {string} key ルートキー（先頭/末尾スラッシュ無し。例: "color-theory/pccs-basics"）
 * @param {{ title: string }} entry
 * @returns {Manifest}
 */
export const upsertManifest = (path, key, entry) => {
  const manifest = readManifest(path)
  manifest.routes[key] = { title: entry.title }
  writeManifest(path, manifest)
  return manifest
}

/**
 * @param {string} path
 * @param {Manifest} manifest
 */
export const writeManifest = (path, manifest) => {
  const sortedKeys = Object.keys(manifest.routes).sort()
  const routes = {}
  for (const k of sortedKeys) routes[k] = manifest.routes[k]
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify({ routes }, null, 2) + "\n", "utf8")
}
