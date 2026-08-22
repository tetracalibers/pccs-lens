// 走査対象の場所と、グラフの「大分類」の定義。
//
// このツールは app を **読み取るだけ** で、app 側には一切手を入れない。
// 参照先は app/src/routes（記事本文）と app/src/lib/content-pages（ユニット定義の YAML）のみ。

import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

/** link-graph/ のルート。 */
export const TOOL_DIR = path.resolve(here, "..")

/** リポジトリのルート。 */
export const REPO_DIR = path.resolve(TOOL_DIR, "..")

/** app のルート。 */
export const APP_DIR = path.join(REPO_DIR, "app")

/** 記事ページの置き場。ここ配下の `+page.svx` / `+page.svelte` を走査する。 */
export const ROUTES_DIR = path.join(APP_DIR, "src", "routes")

/** ユニット定義 YAML の置き場。 */
export const CONTENT_PAGES_DIR = path.join(APP_DIR, "src", "lib", "content-pages")

/** CG のユニット YAML（1 ファイル = 1 ユニット）の置き場。 */
export const CG_UNITS_DIR = path.join(CONTENT_PAGES_DIR, "cg")

/**
 * 大分類。囲み（compound node）としては描かないが、フィルタの単位として残す。
 *
 * - `id` … ルートの第 1 セグメントと一致させる（`/cg/...` → `cg`）
 * - `label` … 既存の一覧ページの呼称に揃える
 * - `unitSource` … ユニット（囲み）の決め方
 *     - `"yaml-category"` … ルートがフラットなので YAML のカテゴリ（`id`）から引く
 *     - `"path-segment"` … ルートの第 2 セグメントがそのままユニット
 * - `defaultOn` … 起動時にフィルタが ON かどうか
 *
 * @type {{ id: string, label: string, unitSource: "yaml-category" | "path-segment", defaultOn: boolean }[]}
 */
export const GROUPS = [
  { id: "color-theory", label: "色の理論", unitSource: "yaml-category", defaultOn: false },
  { id: "color-fields", label: "色の活用分野", unitSource: "yaml-category", defaultOn: false },
  { id: "cg", label: "CGと画像処理", unitSource: "path-segment", defaultOn: true }
]

/** 大分類 id → 定義。 */
export const GROUP_BY_ID = new Map(GROUPS.map((group) => [group.id, group]))

/**
 * リンクを抽出しないディレクティブ。
 *
 * - `Pending` … 採否を検討中の文章であり、まだ本文ではない
 * - `Add` / `Edit` / `Modify` / `Delete` … 編集指示メモであり本文ではない
 * - `Todo` … 図版・デモの未実装プレースホルダであり本文ではない
 *
 * `apply-edit-requests` スキルが扱う集合と同一。
 */
export const EXCLUDED_DIRECTIVES = new Set(["Pending", "Add", "Edit", "Modify", "Delete", "Todo"])

/** 本文なし（雛形のまま）と判定する本文。空白を除いてこれと一致したら「本文なし」。 */
export const EMPTY_BODY_SIGNATURE = "##TODO"
