import data from "./cg.yaml"
import type { CategoryRef, PageLink } from "./types"
import { isPageLink } from "./types"
import type { CgGroup } from "$lib/meta/group"

export interface CgDraftLink {
  title: string
  group: CgGroup[]
}

export type CgLink = PageLink | CgDraftLink

export interface CgSection {
  title: string
  links: CgLink[]
}

export interface CgCategory {
  title: string
  id: string
  summary?: string
  sections: CgSection[]
}

export const cgCategories = data as unknown as CgCategory[]

/** カテゴリの id はプレースホルダ（TODO）のため、一覧ページの見出し id と揃えて index から生成する。 */
export const cgCategoryId = (index: number): string => `cg-category-${index}`

export const cgCategoryBySlug: Map<string, CategoryRef> = new Map(
  cgCategories.flatMap((category, ci) =>
    category.sections.flatMap((section) =>
      section.links.flatMap(
        (link): Array<[string, CategoryRef]> =>
          isPageLink(link) ? [[link.slug, { id: cgCategoryId(ci), title: category.title }]] : []
      )
    )
  )
)
