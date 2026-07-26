import { resolve } from "$app/paths"
import { colorTheoryPageNav } from "$lib/content-pages/color-theory-nav"
import { colorFieldsPageNav } from "$lib/content-pages/color-fields-nav"
import { cgPages, cgGroupIdByRoute } from "$lib/content-pages/cg"
import { cgArticlePageNav } from "$lib/content-pages/cg-article-nav"
import { JIS_COLOR_FAMILIES } from "$lib/data/jis-colors"
import { THEMES } from "$lib/patterns/themes"
import { FOOTER_NAV_ITEMS } from "$lib/meta/site-nav"

/** 中央の戻り先リンクの既定ラベル。 */
const LIST_LABEL = "一覧へ戻る"

/** インデックスページ間を送るときの中央リンクのラベル。描画側でこの値だけ <wbr /> を挿し込む。 */
export const SITE_GUIDE_LABEL = "このサイトの歩き方"

/** ページ送りの1リンク。 */
export interface FooterNavLink {
  title: string
  href: string
}

/** フッターのページ送り一式。prev / next は端で途切れる系統では undefined になる。 */
export interface FooterPageNav {
  prev?: FooterNavLink
  next?: FooterNavLink
  /** 中央の戻り先リンク。 */
  list: { href: string; label: string }
}

type RouteParams = Record<string, string>

/**
 * 1系統ぶんのページ送り解決。
 * 担当外のルートなら null を返し、次の解決子に処理を譲る。
 */
type NavResolver = (routeId: string, params: RouteParams) => FooterPageNav | null

const backToList = (href: string) => ({ href, label: LIST_LABEL })

/** 循環リスト上で index の前後にあたる要素を返す。両端はつながる。 */
const cyclicNeighbors = <T>(items: readonly T[], index: number): { prev: T; next: T } => ({
  prev: items[(index - 1 + items.length) % items.length],
  next: items[(index + 1) % items.length]
})

// CG ユニットページ（動的ルート /cg/[slug]）は cgGroups のカリキュラム順で前後に送る
const cgUnitNav: NavResolver = (routeId, params) => {
  if (routeId !== "/cg/[slug]") return null
  const index = cgPages.findIndex((cgPage) => cgPage.route === params.slug)
  if (index === -1) return null
  const prev = cgPages[index - 1]
  const next = cgPages[index + 1]
  const groupId = cgGroupIdByRoute.get(cgPages[index].route)
  return {
    prev: prev && { title: prev.title, href: prev.href },
    next: next && { title: next.title, href: next.href },
    list: backToList(groupId ? `${resolve("/cg")}#${groupId}` : resolve("/cg"))
  }
}

// CG 記事ページ（静的ネストルート /cg/<unit>/<article>）は記事の読み順で前後に送る
const cgArticleNav: NavResolver = (routeId) => {
  if (!routeId.startsWith("/cg/") || routeId === "/cg/[slug]") return null
  const nav = cgArticlePageNav.get(routeId.slice(1))
  if (!nav) return null
  return { prev: nav.prev, next: nav.next, list: backToList(nav.listHref) }
}

// 色系統ごとの慣用色名マップ（/jis-color-map/[family]）は色系統の並び順で循環的に前後へ送る
const jisFamilyNav: NavResolver = (routeId, params) => {
  if (routeId !== "/jis-color-map/[family]") return null
  const index = JIS_COLOR_FAMILIES.findIndex((family) => family.id === params.family)
  if (index === -1) return null
  const { prev, next } = cyclicNeighbors(JIS_COLOR_FAMILIES, index)
  return {
    prev: { title: prev.name, href: resolve("/jis-color-map/[family]", { family: prev.id }) },
    next: { title: next.name, href: resolve("/jis-color-map/[family]", { family: next.id }) },
    list: backToList(resolve("/jis-color-map"))
  }
}

// イメージ別の配色シミュレータ（/patterns/[theme]）はテーマの並び順で循環的に前後へ送る
const patternThemeNav: NavResolver = (routeId, params) => {
  if (routeId !== "/patterns/[theme]") return null
  const index = THEMES.findIndex((theme) => theme.id === params.theme)
  if (index === -1) return null
  const { prev, next } = cyclicNeighbors(THEMES, index)
  return {
    prev: { title: prev.labelJa, href: resolve("/patterns/[theme]", { theme: prev.id }) },
    next: { title: next.labelJa, href: resolve("/patterns/[theme]", { theme: next.id }) },
    list: backToList(resolve("/patterns"))
  }
}

// ヘッダーナビのインデックスページ（CG は除外）は、ヘッダーと同じ順で循環的に前後へ送る。
// 中央リンクは単独リンク時と同じ「このサイトの歩き方」(/concept) のまま。
const navIndexNav: NavResolver = (routeId) => {
  const index = FOOTER_NAV_ITEMS.findIndex((item) => item.path === routeId)
  if (index === -1) return null
  const { prev, next } = cyclicNeighbors(FOOTER_NAV_ITEMS, index)
  return {
    prev: { title: prev.label, href: prev.href },
    next: { title: next.label, href: next.href },
    list: { href: resolve("/concept"), label: SITE_GUIDE_LABEL }
  }
}

// 色の理論・色の活用分野の記事ページは、カテゴリ内の読み順で前後に送る。
// base はルート解決のためリテラル型を保つ必要があるので、as const のタプルで持つ。
const GUIDE_SERIES = [
  { base: "color-theory", pageNav: colorTheoryPageNav },
  { base: "color-fields", pageNav: colorFieldsPageNav }
] as const

const guideArticleNav: NavResolver = (routeId) => {
  for (const { base, pageNav } of GUIDE_SERIES) {
    const prefix = `/${base}/`
    if (!routeId.startsWith(prefix)) continue
    const slug = routeId.slice(prefix.length)
    if (!slug || slug.includes("/")) continue
    const nav = pageNav.get(slug)
    if (!nav) return null
    // @ts-expect-error dynamic route path
    const href = (entrySlug: string): string => resolve(`/${base}/${entrySlug}`)
    return {
      prev: nav.prev && { title: nav.prev.title, href: href(nav.prev.slug) },
      next: nav.next && { title: nav.next.title, href: href(nav.next.slug) },
      list: backToList(`${resolve(`/${base}`)}#${nav.categoryId}`)
    }
  }
  return null
}

// 上から順に試し、最初に担当を名乗った系統の結果を使う。
const NAV_RESOLVERS: NavResolver[] = [
  cgUnitNav,
  cgArticleNav,
  jisFamilyNav,
  patternThemeNav,
  navIndexNav,
  guideArticleNav
]

/** 現在ページのフッターページ送りを返す。ページ送りを持たない系統では null。 */
export const footerPageNavFor = (
  routeId: string | null,
  params: RouteParams
): FooterPageNav | null => {
  if (!routeId) return null
  for (const resolver of NAV_RESOLVERS) {
    const nav = resolver(routeId, params)
    if (nav) return nav
  }
  return null
}

/** ページ送りを持たないページのフッターに1つだけ置くリンク。 */
export const footerSoloLinkFor = (routeId: string | null): FooterNavLink => {
  if (routeId === "/cg") return { title: "トップへ戻る", href: resolve("/") }
  if (routeId === "/concept") return { title: "トップページへ", href: resolve("/") }
  return { title: SITE_GUIDE_LABEL, href: resolve("/concept") }
}
