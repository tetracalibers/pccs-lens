import type { CgGroup } from "./group"

export type GuideFrontmatter = {
  title: string
  grades: ("3" | "2" | "1" | "uc")[]
  group: CgGroup[]
  useful?: boolean
  draft?: boolean
}

export type GuideBase = "color-theory" | "color-fields" | "cg"

const modules = import.meta.glob(
  [
    "/src/routes/color-theory/**/+page.svx",
    "!/src/routes/color-theory/+page.svx",
    "/src/routes/color-fields/**/+page.svx",
    "!/src/routes/color-fields/+page.svx",
    "/src/routes/cg/**/+page.svx",
    "!/src/routes/cg/+page.svx"
  ],
  { eager: true }
) as Record<string, { metadata: Partial<GuideFrontmatter> }>

/** key: `${base}/${slug}`（例: "color-theory/pccs"、"color-fields/fashion-color-concepts"）, value: フロントマター */
export const guidePages: Map<string, GuideFrontmatter> = new Map(
  Object.entries(modules).map(([filePath, mod]) => {
    const key = filePath.replace(/^\/src\/routes\//, "").replace(/\/\+page\.svx$/, "")
    const meta = mod.metadata
    return [
      key,
      {
        title: meta.title ?? "",
        grades: meta.grades ?? [],
        group: meta.group ?? [],
        useful: meta.useful ?? false,
        draft: meta.draft ?? false
      }
    ]
  })
)
