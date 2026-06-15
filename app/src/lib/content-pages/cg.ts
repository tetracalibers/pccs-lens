import { resolve } from "$app/paths"
import type { ResolvedPathname } from "$app/types"
import basicsData from "./cg-basics.yaml"
import modelingData from "./cg-modeling.yaml"
import transformationData from "./cg-transformation.yaml"
import renderingData from "./cg-rendering.yaml"
import type { PageLink } from "./types"
import type { CgGroup } from "$lib/meta/group"

export interface CgDraftLink {
  title: string
  group: CgGroup[]
}

export type CgLink = PageLink | CgDraftLink

export interface CgSection {
  heading: string
  id: string
  links: CgLink[]
}

interface CgPageData {
  title: string
  sections: CgSection[]
}

export interface CgPage extends CgPageData {
  /** ルートセグメント（例: "cg-basics"）。 */
  route: string
  href: ResolvedPathname
}

export const cgBasics: CgPage = {
  route: "cg-basics",
  href: resolve("/cg-basics"),
  ...(basicsData as unknown as CgPageData)
}

export const cgModeling: CgPage = {
  route: "cg-modeling",
  href: resolve("/cg-modeling"),
  ...(modelingData as unknown as CgPageData)
}

export const cgTransformation: CgPage = {
  route: "cg-transformation",
  href: resolve("/cg-transformation"),
  ...(transformationData as unknown as CgPageData)
}

export const cgRendering: CgPage = {
  route: "cg-rendering",
  href: resolve("/cg-rendering"),
  ...(renderingData as unknown as CgPageData)
}

// トップページのカード順に合わせる（CGと画像 → 座標と図形の変換 → モデリング → レンダリング）
export const cgPages: CgPage[] = [cgBasics, cgTransformation, cgModeling, cgRendering]

export const cgPageByRoute: Map<string, CgPage> = new Map(cgPages.map((page) => [page.route, page]))
