import type { AftGrade } from "$lib/meta/grade"

export interface PageLink {
  slug: string
}

export interface DraftLink {
  title: string
  grades: AftGrade[]
  useful?: boolean
}

export type Link = PageLink | DraftLink

export const isPageLink = (link: Link): link is PageLink => "slug" in link

export interface CategorySection {
  title: string
  links: Link[]
}

export interface Category {
  title: string
  id: string
  summary: string
  sections: CategorySection[]
}

export interface PageNavEntry {
  slug: string
  title: string
}

export interface PageNavLinks {
  prev?: PageNavEntry
  next?: PageNavEntry
  categoryId: string
}

export interface CategoryRef {
  id: string
  title: string
}
