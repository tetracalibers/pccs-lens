import type { SuggestInput, SuggestOutput } from "./types"
import { getThemeOrThrow, hueDistance } from "./themes"

export { hueDistance }

export function computeSuggest(input: SuggestInput): SuggestOutput {
  const theme = getThemeOrThrow(input.theme)

  let output: SuggestOutput
  switch (input.role) {
    case "base":
      output = theme.rules.base()
      break
    case "assort":
      output = theme.rules.assort(input.baseColor)
      break
    case "accent":
      output = theme.rules.accent(input.baseColor, input.assortColor)
      break
  }

  // フォールバック: 両配列が空の場合はテーマ全体をサジェスト
  if (output.suggestedHues.length === 0 && output.suggestedTones.length === 0) {
    return { suggestedHues: [...theme.allowedHues], suggestedTones: [...theme.allowedTones] }
  }

  return output
}
