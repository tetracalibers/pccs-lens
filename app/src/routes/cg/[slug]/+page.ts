import { error } from "@sveltejs/kit"
import { cgPageByRoute, cgPages } from "$lib/content-pages/cg"
import type { EntryGenerator, PageLoad } from "./$types"

export const load: PageLoad = ({ params }) => {
  const page = cgPageByRoute.get(params.slug)
  if (!page) error(404, `CGページ "${params.slug}" は存在しません`)
  return { page }
}

// 全ユニットを静的生成する
export const entries: EntryGenerator = () => cgPages.map((page) => ({ slug: page.route }))

export const prerender = true
