import data from "./color-fields.yaml"
import type { Category, CategoryRef } from "./types"
import { isPageLink } from "./types"

export const colorFieldsCategories = data as unknown as Category[]

export const colorFieldsCategoryBySlug: Map<string, CategoryRef> = new Map(
  colorFieldsCategories.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.links.flatMap(
        (link): Array<[string, CategoryRef]> =>
          isPageLink(link) ? [[link.slug, { id: category.id, title: category.title }]] : []
      )
    )
  )
)
