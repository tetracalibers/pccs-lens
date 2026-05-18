import data from "./color-fields.yaml"
import type { Category, PageNavEntry, PageNavLinks } from "./types"
import { isPageLink } from "./types"
import { guidePages } from "$lib/meta/guide-pages"

export const colorFieldsCategories = data as unknown as Category[]

const BASE = "color-fields"

const orderedPublishedPages: PageNavEntry[] = colorFieldsCategories.flatMap((category) =>
  category.sections.flatMap((section) =>
    section.links.flatMap((link) => {
      if (!isPageLink(link)) return []
      const meta = guidePages.get(`${BASE}/${link.slug}`)
      if (!meta || meta.draft) return []
      return [{ slug: link.slug, title: meta.title }]
    })
  )
)

export const colorFieldsPageNav: Map<string, PageNavLinks> = new Map(
  orderedPublishedPages.map((entry, i) => [
    entry.slug,
    {
      prev: orderedPublishedPages[i - 1],
      next: orderedPublishedPages[i + 1]
    }
  ])
)
