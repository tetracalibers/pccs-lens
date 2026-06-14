import data from "./cg.yaml"
import type { PageLink } from "./types"

export type CgGroup = "CG" | "ImgP"

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
