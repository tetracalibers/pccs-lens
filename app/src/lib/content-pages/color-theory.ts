import data from "./color-theory.yaml"
import type { Category, CategoryRef } from "./types"
import { isPageLink } from "./types"

export const colorTheoryCategories = data as unknown as Category[]

export const colorTheoryCategoryBySlug: Map<string, CategoryRef> = new Map(
  colorTheoryCategories.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.links.flatMap(
        (link): Array<[string, CategoryRef]> =>
          isPageLink(link) ? [[link.slug, { id: category.id, title: category.title }]] : []
      )
    )
  )
)
