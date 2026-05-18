import { colorFieldsCategories } from "./color-fields"
import type { PageNavEntry, PageNavLinks } from "./types"
import { isPageLink } from "./types"
import { guidePages } from "$lib/meta/guide-pages"

const BASE = "color-fields"

type OrderedEntry = PageNavEntry & { categoryId: string }

const toNavEntry = ({ slug, title }: OrderedEntry): PageNavEntry => ({ slug, title })

let _pageNav: Map<string, PageNavLinks> | undefined

const buildPageNav = (): Map<string, PageNavLinks> => {
  const ordered: OrderedEntry[] = colorFieldsCategories.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.links.flatMap((link) => {
        if (!isPageLink(link)) return []
        const meta = guidePages.get(`${BASE}/${link.slug}`)
        if (!meta || meta.draft) return []
        return [{ slug: link.slug, title: meta.title, categoryId: category.id }]
      })
    )
  )
  return new Map(
    ordered.map((entry, i) => [
      entry.slug,
      {
        prev: ordered[i - 1] ? toNavEntry(ordered[i - 1]) : undefined,
        next: ordered[i + 1] ? toNavEntry(ordered[i + 1]) : undefined,
        categoryId: entry.categoryId
      }
    ])
  )
}

export const colorFieldsPageNav = {
  get: (slug: string): PageNavLinks | undefined => (_pageNav ??= buildPageNav()).get(slug)
}
