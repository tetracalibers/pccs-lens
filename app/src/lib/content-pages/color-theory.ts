import data from "./color-theory.yaml"
import type { Category, PageNavEntry, PageNavLinks } from "./types"
import { isPageLink } from "./types"
import { guidePages } from "$lib/meta/guide-pages"

export const colorTheoryCategories = data as unknown as Category[]

const BASE = "color-theory"

const orderedPublishedPages: PageNavEntry[] = colorTheoryCategories.flatMap((category) =>
  category.sections.flatMap((section) =>
    section.links.flatMap((link) => {
      if (!isPageLink(link)) return []
      const meta = guidePages.get(`${BASE}/${link.slug}`)
      if (!meta || meta.draft) return []
      return [{ slug: link.slug, title: meta.title }]
    })
  )
)

export const colorTheoryPageNav: Map<string, PageNavLinks> = new Map(
  orderedPublishedPages.map((entry, i) => [
    entry.slug,
    {
      prev: orderedPublishedPages[i - 1],
      next: orderedPublishedPages[i + 1]
    }
  ])
)
