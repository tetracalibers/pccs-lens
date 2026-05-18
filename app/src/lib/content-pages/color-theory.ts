import data from "./color-theory.yaml"
import type { Category, CategoryRef, PageNavEntry, PageNavLinks } from "./types"
import { isPageLink } from "./types"
import { guidePages } from "$lib/meta/guide-pages"

export const colorTheoryCategories = data as unknown as Category[]

const BASE = "color-theory"

export const colorTheoryCategoryBySlug: Map<string, CategoryRef> = new Map(
  colorTheoryCategories.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.links.flatMap((link): Array<[string, CategoryRef]> =>
        isPageLink(link) ? [[link.slug, { id: category.id, title: category.title }]] : []
      )
    )
  )
)

type OrderedEntry = PageNavEntry & { categoryId: string }

const toNavEntry = ({ slug, title }: OrderedEntry): PageNavEntry => ({ slug, title })

let _pageNav: Map<string, PageNavLinks> | undefined

const buildPageNav = (): Map<string, PageNavLinks> => {
  const ordered: OrderedEntry[] = colorTheoryCategories.flatMap((category) =>
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

export const colorTheoryPageNav = {
  get: (slug: string): PageNavLinks | undefined => (_pageNav ??= buildPageNav()).get(slug)
}
