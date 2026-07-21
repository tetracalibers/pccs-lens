import manifest from "./og-manifest.json"

/**
 * OGP / Twitter Card 用のサイト共通メタ情報と、pathname → 各ページのメタ解決。
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
const DEFAULT_IMAGE_KEY = "default"

interface OgManifest {
  routes: Record<string, { title: string }>
}

const routes = (manifest as OgManifest).routes

export interface ResolvedOgMeta {
  /** og:title（サイト名サフィックス抜き。未生成・トップは "Color Prism"） */
  title: string
  /** og:description（サイト共通） */
  description: string
  /** og:image（絶対 URL） */
  imageUrl: string
  /** og:image:alt */
  imageAlt: string
  /** og:url（正規オリジン＋pathname、trailingSlash: always） */
  url: string
}

const stripSlashes = (s: string) => s.replace(/^\/+/, "").replace(/\/+$/, "")

/**
 * pathname を base を除いたルートキー（先頭/末尾スラッシュ無し）に変換する。トップは ""。
 * @param pathname 例: "/pccs-lens/color-theory/pccs-basics/"
 * @param base $app/paths の base（本番は ""、GitHub Pages は "/pccs-lens"）
 */
export const routeKeyFromPathname = (pathname: string, base = ""): string => {
  let p = pathname
  if (base && p.startsWith(base)) p = p.slice(base.length)
  return stripSlashes(p)
}

/**
 * pathname から当該ページの OGP メタを解決する。
 */
export const resolveOgMeta = (pathname: string, base = ""): ResolvedOgMeta => {
  const key = routeKeyFromPathname(pathname, base)
  const entry = key ? routes[key] : undefined

  const imageKey = entry ? key : DEFAULT_IMAGE_KEY
  const imageUrl = `${SITE_ORIGIN}/ogp/${imageKey}.png`
  const url = `${SITE_ORIGIN}/${key ? `${key}/` : ""}`
  const title = entry ? entry.title : SITE_NAME
  const imageAlt = entry ? entry.title : `${SITE_NAME} — ${SITE_DESCRIPTION}`

  return { title, description: SITE_DESCRIPTION, imageUrl, imageAlt, url }
}
