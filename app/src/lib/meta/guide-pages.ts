export type GuideFrontmatter = {
  title: string
  grades: ("3" | "2" | "1" | "uc")[]
  basic?: boolean
  draft?: boolean
}

const modules = import.meta.glob(
  ["/src/routes/color-theory/**/+page.svx", "!/src/routes/color-theory/+page.svx"],
  { eager: true }
) as Record<string, { metadata: GuideFrontmatter }>

/** key: スラッグ（例: "pccs"、"pccs/sub"）, value: フロントマター */
export const guidePages: Map<string, GuideFrontmatter> = new Map(
  Object.entries(modules).map(([filePath, mod]) => {
    const slug = filePath
      .replace(/^\/src\/routes\/color-theory\//, "")
      .replace(/\/\+page\.svx$/, "")
    const meta = mod.metadata
    return [
      slug,
      {
        title: meta.title,
        grades: meta.grades ?? [],
        basic: meta.basic ?? false,
        draft: meta.draft ?? false
      }
    ]
  })
)
