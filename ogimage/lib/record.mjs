// OGP 画像の「記録（正）」を読み書きするヘルパ。
//
// 記録は per-route の JSON（ogimage/data/<route>.json）で、スキル（知能層）が解決した確定値
// ——タイトル・改行済みタイトル・パンくず・図版の永続パス——を保存する。これが「生成対象の
// レジストリ」であり、一括再生成（regenerate.mjs）はこの記録集合を唯一の情報源にする。
//
// 図版は手渡しの一時パスから ogimage/data/assets/<route>/figure.<ext> へコピーして永続化し、
// 記録の figure には data ディレクトリ基準の相対パスを書く。

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from "node:fs"
import { dirname, join, resolve, extname, relative, sep } from "node:path"

/**
 * @typedef {object} OgRecord
 * @property {string}   route       ルートキー（先頭/末尾スラッシュ無し。例: "color-theory/pccs-basics"）
 * @property {string}   title       og:title 用の完全なタイトル
 * @property {string[]} titleLines  描画用の改行済みタイトル（1〜2 要素）
 * @property {string[]} [crumbs]    nested 系のみ。title-only では省略
 * @property {string}   [figure]    図版があるときのみ（data 基準の相対パス）
 */

/** 記録ファイルのパス（data 基準の key から）。 */
export const recordPath = (dataDir, key) => join(dataDir, `${key}.json`)

/**
 * 記録を読む。無ければ / 壊れていれば null。
 * @param {string} dataDir
 * @param {string} key
 * @returns {OgRecord | null}
 */
export const readRecord = (dataDir, key) => {
  try {
    return JSON.parse(readFileSync(recordPath(dataDir, key), "utf8"))
  } catch {
    return null
  }
}

/**
 * 記録を書き出す（2 スペースインデント・末尾改行）。冪等。
 * @param {string} dataDir
 * @param {string} key
 * @param {OgRecord} record
 * @returns {string} 書き出したパス
 */
export const writeRecord = (dataDir, key, record) => {
  const path = recordPath(dataDir, key)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(record, null, 2) + "\n", "utf8")
  return path
}

/**
 * 図版を data/assets/<key>/figure.<ext> へコピーし、data 基準の相対パスを返す。
 * ファイル名は固定ベース名 "figure" ＋元の拡張子（同一パスへ上書き＝冪等。差し替え時にゴミが残らない）。
 * コピー元がすでにその永続パス自身なら（regenerate 経由）コピーはスキップする。
 * @param {string} dataDir
 * @param {string} key
 * @param {string} srcAbsPath コピー元（絶対パス）
 * @returns {string} data 基準の相対パス（例: "assets/color-theory/pccs-basics/figure.png"）
 */
export const copyFigureIntoData = (dataDir, key, srcAbsPath) => {
  const ext = extname(srcAbsPath).toLowerCase() || ".png"
  const relPath = `assets/${key}/figure${ext}`
  const destAbs = resolve(dataDir, relPath)
  if (resolve(srcAbsPath) !== destAbs) {
    mkdirSync(dirname(destAbs), { recursive: true })
    copyFileSync(srcAbsPath, destAbs)
  }
  return relPath
}

/**
 * 記録の figure（data 基準の相対パス）を絶対パスに解決する。
 * @param {string} dataDir
 * @param {string} relPath
 * @returns {string}
 */
export const resolveFigureFromData = (dataDir, relPath) => resolve(dataDir, relPath)

/**
 * data ディレクトリ配下の全記録（*.json）を列挙する。assets/ 配下は図版 PNG なので走査から除外する。
 * 記録の存在そのものがレジストリであり、別インデックスは持たない。
 * @param {string} dataDir
 * @returns {{ key: string, record: OgRecord | null, path: string, error?: Error }[]}
 */
export const listRecords = (dataDir) => {
  if (!existsSync(dataDir)) return []
  const results = []
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        // data 直下の assets/ は図版アセット置き場。記録ではないので入らない。
        if (dir === dataDir && ent.name === "assets") continue
        walk(join(dir, ent.name))
      } else if (ent.isFile() && ent.name.endsWith(".json")) {
        const full = join(dir, ent.name)
        const key = relative(dataDir, full).slice(0, -".json".length).split(sep).join("/")
        try {
          results.push({ key, record: JSON.parse(readFileSync(full, "utf8")), path: full })
        } catch (error) {
          results.push({ key, record: null, path: full, error })
        }
      }
    }
  }
  walk(dataDir)
  results.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  return results
}
