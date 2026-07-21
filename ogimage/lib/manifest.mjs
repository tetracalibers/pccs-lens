// 生成済みルートのマニフェスト（app/src/lib/meta/og-manifest.json）を読み書きする。
// アプリ側の <SiteMeta> がこの JSON を import し、載っているルートは固有の og:image / og:title を、
// 無ければ既定画像・サイト名にフォールバックする。
//
// マニフェストは記録（ogimage/data/）からの「派生物」。単発・部分再生成では upsert（対象外ページを
// 消さない）、全再生成では rebuild（記録の全集合から作り直し、削除ページの項目を自己修復で落とす）。

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
 * マニフェストを記録の全集合から作り直す（全再生成用）。既存の項目は破棄して置き換えるため、
 * 削除されたページの項目は自動的に消える（派生物としての自己修復）。
 * @param {string} path
 * @param {{ key: string, title: string }[]} entries
 * @returns {Manifest}
 */
export const rebuildManifest = (path, entries) => {
  const routes = {}
  for (const { key, title } of entries) routes[key] = { title }
  const manifest = { routes }
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
