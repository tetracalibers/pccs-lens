import { resolve } from "$app/paths"
import type { ResolvedPathname } from "$app/types"
import { cgPages, cgPageByRoute } from "./cg"
import { isPageLink } from "./types"
import { guidePages } from "$lib/meta/guide-pages"

export interface CgArticleNavEntry {
  title: string
  href: ResolvedPathname
}

export interface CgArticleNavLinks {
  prev?: CgArticleNavEntry
  next?: CgArticleNavEntry
  /** 記事が属するユニットページ（/cg/<unit>）への「一覧へ戻る」リンク。 */
  listHref: ResolvedPathname
}

interface OrderedArticle extends CgArticleNavEntry {
  /** guidePages のキー（例: "cg/basics/cg-and-image-processing"）。 */
  key: string
  /** 所属ユニットの route（YAMLファイル名、例: "basics"）。 */
  unitRoute: string
}

let _pageNav: Map<string, CgArticleNavLinks> | undefined

const buildPageNav = (): Map<string, CgArticleNavLinks> => {
  // カリキュラム順（cgPages）× 各ユニットの YAML リンク順で記事を一列に並べる。
  // 実ページが存在する PageLink（slug あり）のみ対象とし、下書きは除く。
  const ordered: OrderedArticle[] = cgPages.flatMap((unit) =>
    unit.sections.flatMap((section) =>
      section.links.flatMap((link) => {
        if (!isPageLink(link)) return []
        const key = `cg/${unit.route}/${link.slug}`
        const meta = guidePages.get(key)
        if (!meta || meta.draft) return []
        const href = resolve(`/cg/${unit.route}/${link.slug}`)
        return [{ key, unitRoute: unit.route, title: meta.title, href }]
      })
    )
  )

  return new Map(
    ordered.map((entry, i) => {
      const prev = ordered[i - 1]
      const next = ordered[i + 1]
      const unit = cgPageByRoute.get(entry.unitRoute)
      return [
        entry.key,
        {
          prev: prev ? { title: prev.title, href: prev.href } : undefined,
          next: next ? { title: next.title, href: next.href } : undefined,
          listHref: unit ? unit.href : resolve("/cg")
        }
      ]
    })
  )
}

export const cgArticlePageNav = {
  get: (key: string): CgArticleNavLinks | undefined => (_pageNav ??= buildPageNav()).get(key)
}
