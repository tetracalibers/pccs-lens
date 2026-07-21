// @ts-check

/**
 * OGP / Twitter Card 用のサイト共通メタ情報と、ルートキー → 各ページのメタ解決（依存なしの純関数）。
 *
 * アプリと「ビルド後注入スクリプト」（scripts/inject-og-meta.mjs）の双方から使えるよう、
 * SvelteKit のエイリアスや JSON import に依存しないプレーン JS として切り出している。
 *
 * og:image と og:title は「生成済みルート一覧」であるマニフェスト（og-manifest.json）を単一の情報源とする。
 * マニフェストに載っているルートは固有の画像・タイトルを、載っていないルート（未生成 / draft / トップ）は
 * 既定画像・サイト名にフォールバックする。マニフェストは ogimage の描画スクリプトが生成・更新する。
 */

/** 正規オリジン。絶対 URL はここから組み立てる（base の有無に関わらず本番オリジンを使う）。 */
export const SITE_ORIGIN = "https://color-prism.net"
export const SITE_NAME = "Color Prism"
/** サイト共通の og:description（全ページ共通）。 */
export const SITE_DESCRIPTION = "見て・触って学ぶ 色彩の暗記帳"
/** 既定 og:image のルートキー（app/static/ogp/default.png ＝ default バリエーション）。 */
export const DEFAULT_IMAGE_KEY = "default"

/**
 * @typedef {{ title: string }} OgManifestEntry
 * @typedef {Record<string, OgManifestEntry>} OgManifestRoutes
 * @typedef {object} ResolvedOgMeta
 * @property {string} title og:title（サイト名サフィックス抜き。未生成・トップは "Color Prism"）
 * @property {string} description og:description（サイト共通）
 * @property {string} imageUrl og:image（絶対 URL）
 * @property {string} imageAlt og:image:alt
 * @property {string} url og:url（正規オリジン＋pathname、trailingSlash: always）
 */

/**
 * @param {string} s
 * @returns {string}
 */
const stripSlashes = (s) => s.replace(/^\/+/, "").replace(/\/+$/, "")

/**
 * pathname を base を除いたルートキー（先頭/末尾スラッシュ無し）に変換する。トップは ""。
 * @param {string} pathname 例: "/color-theory/pccs-basics/"
 * @param {string} [base] $app/paths の base（本番は ""、GitHub Pages は "/pccs-lens"）
 * @returns {string}
 */
export const routeKeyFromPathname = (pathname, base = "") => {
  let p = pathname
  if (base && p.startsWith(base)) p = p.slice(base.length)
  return stripSlashes(p)
}

/**
 * ルートキーから当該ページの OGP メタを解決する。
 * @param {string} key 先頭/末尾スラッシュ無しのルートキー。トップは ""。
 * @param {OgManifestRoutes} routes マニフェストの routes オブジェクト。
 * @returns {ResolvedOgMeta}
 */
export const resolveOgMetaForKey = (key, routes) => {
  const entry = key ? routes[key] : undefined

  const imageKey = entry ? key : DEFAULT_IMAGE_KEY
  const imageUrl = `${SITE_ORIGIN}/ogp/${imageKey}.png`
  const url = `${SITE_ORIGIN}/${key ? `${key}/` : ""}`
  const title = entry ? entry.title : SITE_NAME
  const imageAlt = entry ? entry.title : `${SITE_NAME} — ${SITE_DESCRIPTION}`

  return { title, description: SITE_DESCRIPTION, imageUrl, imageAlt, url }
}

/**
 * pathname から当該ページの OGP メタを解決する。
 * @param {string} pathname
 * @param {OgManifestRoutes} routes マニフェストの routes オブジェクト。
 * @param {string} [base]
 * @returns {ResolvedOgMeta}
 */
export const resolveOgMeta = (pathname, routes, base = "") =>
  resolveOgMetaForKey(routeKeyFromPathname(pathname, base), routes)
