import { error } from "@sveltejs/kit"
import { getTheme } from "$lib/patterns/themes"

export const ssr = false

export function load({ params }: { params: { theme: string } }) {
  const theme = getTheme(params.theme)
  if (!theme) error(404, `テーマ "${params.theme}" は存在しません`)
  return { theme }
}
