import data from "./cg.yaml"

export type CgGroup = "CG" | "ImgP"

export interface CgLink {
  title: string
  group: CgGroup[]
}

export interface CgSection {
  title: string
  links: CgLink[]
}

export interface CgCategory {
  title: string
  id: string
  sections: CgSection[]
}

export const cgCategories = data as unknown as CgCategory[]
