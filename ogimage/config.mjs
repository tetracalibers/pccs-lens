// OGP 画像の「正典設定ファイル」。
//
// ルート（route）→ バリエーション種別・図版の可否の対応を、この 1 ファイルに集約する。
// スキル（生成の知能層）も描画スクリプト（render.mjs）も、ここを唯一の情報源として参照する。
// draft.md の「ページごとの使用バリエーション」表を移植したもの。draft.md 削除後もここが残る。
//
// バリエーション:
//   - default      … メイン=サイト名（トップの既定画像。サイト全体の og:image と共用）
//   - title-only   … メイン=ページタイトル＋フッターにサイト名
//   - nested       … ＋パンくず（crumb）
//   - nested-fig   … ＋図版（手渡し PNG を data URI で埋め込む）
//
// figure（図版の扱い）:
//   - "none"     … 図版なし
//   - "optional" … 図版を入れるかはページ単位でユーザーに確認（入れると nested-fig 相当になる）
//   - "required" … 図版前提（定型プレビュー。当面は手渡し PNG）
//
// theme（配色）:
//   - "light"（省略時の既定） … 白地
//   - "dark"                  … 暗地。実際の配色は lib/build-svg.mjs の THEMES に定義する
//
// tagline（サイト共通のタグライン）:
//   - true  … タイトルの下にタグラインを敷く（default 画像と同じ文字色・文字サイズ）
//   - 省略  … 敷かない（既定）

import picomatch from "picomatch"

/**
 * @typedef {"default" | "title-only" | "nested" | "nested-fig"} Variation
 * @typedef {"none" | "optional" | "required"} FigurePolicy
 * @typedef {"light" | "dark"} Theme
 * @typedef {{ glob: string, variation: Variation, figure: FigurePolicy, theme?: Theme, tagline?: boolean }} OgRule
 */

/**
 * ルート判定規則。**上から順に最初にマッチしたもの**を採用するので、
 * 具体的なパス（完全一致・より深い階層）を上に、汎用的な glob を下に置くこと。
 * glob はリーディングスラッシュ付き・末尾スラッシュ無しのルートに対して評価する（例: "/color-theory/pccs-basics"）。
 * picomatch の既定では `*` は 1 セグメント（`/` を跨がない）、`**` は複数セグメントにマッチする。
 *
 * @type {OgRule[]}
 */
export const OG_RULES = [
  // --- トップ ---
  { glob: "/", variation: "default", figure: "none" },

  // --- 単体ページ / 一覧ページ（title-only）---
  // /concept は「このサイトの歩き方」＝サイト全体の案内なので、タイトルの下にトップと同じ
  // タグラインを敷いて、サイトの性格まで伝える。
  { glob: "/concept", variation: "title-only", figure: "none", tagline: true },
  { glob: "/color-theory", variation: "title-only", figure: "none" },
  { glob: "/color-fields", variation: "title-only", figure: "none" },
  { glob: "/jis-color-map", variation: "title-only", figure: "none" },
  { glob: "/cg", variation: "title-only", figure: "none", theme: "dark" },
  { glob: "/jis-color-map/all", variation: "title-only", figure: "none" },

  // --- 色分析ツール（nested。図版なし）---
  //   一覧ページを持たない単体ツールなので、パンくずは総称の「色分析ツール」を充てる。
  { glob: "/approximate", variation: "nested", figure: "none" },
  { glob: "/analyze", variation: "nested", figure: "none" },

  // --- 配色シミュレータ（nested。図版なし）---
  //   /patterns 自体は一覧ページだが、パンくずには扱っている題材（イメージ別の配色）を出す。
  //   配下の /patterns/<theme> は定型プレビュー（nested-fig）なので下の節に置く。
  { glob: "/patterns", variation: "nested", figure: "none" },

  // --- コンテンツページ（nested。図版は任意）---
  { glob: "/color-theory/*", variation: "nested", figure: "optional" },
  { glob: "/color-fields/*", variation: "nested", figure: "optional" },

  // --- CG コンテンツ（nested・ダーク）---
  //   /cg/<unit>            … ユニット一覧ページ（動的ルート /cg/[slug]）。図版なし
  //   /cg/<unit>/<article>  … 記事ページ（+page.svx）。図版は任意
  //   CG は図版が Three.js デモのスクリーンショット（地色 #26282d）なので、
  //   OGP 側も同じ地色のダークにして図版を背景に溶け込ませる（/cg 一覧ページも揃える）。
  { glob: "/cg/*", variation: "nested", figure: "none", theme: "dark" },
  { glob: "/cg/**", variation: "nested", figure: "optional", theme: "dark" },

  // --- 定型プレビュー（nested-fig。当面は手渡し PNG）---
  { glob: "/jis-color-map/*", variation: "nested-fig", figure: "required" }, // 色系統ごとの慣用色名マップ
  { glob: "/patterns/*", variation: "nested-fig", figure: "required" }, // 配色シミュレータ（バウハウス風プレビュー）
  { glob: "/games/*", variation: "nested-fig", figure: "required" } // 色を見分けるクイズ（出題カードのプレビュー）
]

/**
 * ルート文字列を「リーディングスラッシュ付き・末尾スラッシュ無し」に正規化する。
 * トップだけは "/" のまま。
 * @param {string} route 例: "color-theory/pccs-basics/", "/color-theory/pccs-basics"
 * @returns {string} 例: "/color-theory/pccs-basics"
 */
export const normalizeRoute = (route) => {
  const trimmed = String(route).trim()
  const withLead = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  const withoutTrail = withLead.replace(/\/+$/, "")
  return withoutTrail === "" ? "/" : withoutTrail
}

/**
 * マニフェスト・出力パス用のキー（リーディング/末尾スラッシュ無し）に変換する。
 * トップは "" を返す。
 * @param {string} route
 * @returns {string} 例: "color-theory/pccs-basics"（トップは ""）
 */
export const routeKey = (route) => normalizeRoute(route).replace(/^\/+/, "")

/**
 * ルートに対応する規則を返す。該当なしなら null。
 * @param {string} route
 * @returns {OgRule | null}
 */
export const resolveRule = (route) => {
  const normalized = normalizeRoute(route)
  for (const rule of OG_RULES) {
    if (picomatch.isMatch(normalized, rule.glob)) return rule
  }
  return null
}

/**
 * ルートに対応するテーマを返す。規則に `theme` が無い／規則自体が無い場合は "light"。
 * @param {string} route
 * @returns {Theme}
 */
export const resolveTheme = (route) => resolveRule(route)?.theme ?? "light"

/**
 * ルートにサイト共通のタグラインを敷くかを返す。規則に `tagline` が無い／規則自体が無い場合は false。
 * @param {string} route
 * @returns {boolean}
 */
export const resolveTagline = (route) => resolveRule(route)?.tagline === true

/**
 * ルートに対応するバリエーションを返す（該当なしは null）。
 * 図版が渡され、規則が figure: "optional" のときは "nested-fig" に昇格する。
 * @param {string} route
 * @param {{ hasFigure?: boolean }} [opts]
 * @returns {Variation | null}
 */
export const resolveVariation = (route, opts = {}) => {
  const rule = resolveRule(route)
  if (!rule) return null
  if (rule.figure === "optional" && opts.hasFigure) return "nested-fig"
  return rule.variation
}
