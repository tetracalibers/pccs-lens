import { error } from "@sveltejs/kit"
import { getTheme, THEMES } from "$lib/patterns/themes"
import type { EntryGenerator } from "./$types"

export const ssr = false

// 全テーマを静的生成する（全体プリレンダ下では動的ルートに entries が必須）。
export const entries: EntryGenerator = () => THEMES.map((theme) => ({ theme: theme.id }))

export function load({ params }: { params: { theme: string } }) {
  const theme = getTheme(params.theme)
  if (!theme) error(404, `テーマ "${params.theme}" は存在しません`)
  return { theme }
}
