import { error } from "@sveltejs/kit"
import { isColorFamily, JIS_COLOR_FAMILIES } from "$lib/data/jis-colors"
import type { EntryGenerator } from "./$types"

export const ssr = false

// 全色みを静的生成する（全体プリレンダ下では動的ルートに entries が必須）。
export const entries: EntryGenerator = () =>
  JIS_COLOR_FAMILIES.map((family) => ({ family: family.id }))

export function load({ params }: { params: { family: string } }) {
  if (!isColorFamily(params.family)) {
    error(404, `色み "${params.family}" は存在しません`)
  }
  return { family: params.family }
}
