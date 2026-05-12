export type GuideFrontmatter = {
  title: string
  grades: ("3" | "2" | "1" | "uc")[]
  basic?: boolean
  draft?: boolean
}

export type GuideBase = "color-theory" | "color-fields"

const modules = import.meta.glob(
  [
    "/src/routes/color-theory/**/+page.svx",
    "!/src/routes/color-theory/+page.svx",
    "/src/routes/color-fields/**/+page.svx",
    "!/src/routes/color-fields/+page.svx"
  ],
  { eager: true }
) as Record<string, { metadata: GuideFrontmatter }>

/** key: `${base}/${slug}`（例: "color-theory/pccs"、"color-fields/fashion-color-concepts"）, value: フロントマター */
export const guidePages: Map<string, GuideFrontmatter> = new Map(
  Object.entries(modules).map(([filePath, mod]) => {
    const key = filePath.replace(/^\/src\/routes\//, "").replace(/\/\+page\.svx$/, "")
    const meta = mod.metadata
    return [
      key,
      {
        title: meta.title,
        grades: meta.grades ?? [],
        basic: meta.basic ?? false,
        draft: meta.draft ?? false
      }
    ]
  })
)
