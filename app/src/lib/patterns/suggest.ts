import type { SuggestInput, SuggestOutput, SelectedColor, ThemeDef } from "./types"
import { getThemeOrThrow } from "./themes"
import { isAchromaticTone } from "./lookup"

// ===== ユーティリティ =====

/** 24色相環上の最短距離（0〜12） */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b)
  return Math.min(diff, 24 - diff)
}

const ONE_STEP_MORE_CHROMATIC: Record<string, string> = {
  p: "lt",
  ltg: "sf",
  g: "d",
  dkg: "dk",
  lt: "b",
  sf: "dp",
  d: "dp",
  dk: "dp"
}

function getOneStepMoreChromatic(tone: string): string | null {
  return ONE_STEP_MORE_CHROMATIC[tone] ?? null
}

function isAchromatic(color: SelectedColor): boolean {
  return color.hueNumber === null || isAchromaticTone(color.toneSymbol)
}

function fallback(theme: ThemeDef): SuggestOutput {
  return {
    suggestedHues: [...theme.allowedHues],
    suggestedTones: [...theme.allowedTones]
  }
}

// ===== テーマ別サジェスト =====

function suggestElegant(input: SuggestInput, theme: ThemeDef): SuggestOutput {
  const hues = [19, 20, 21, 22, 23, 24, 1]

  if (input.role === "base") {
    return { suggestedHues: hues, suggestedTones: ["p", "ltg"] }
  }

  if (input.role === "assort") {
    // ベースのトーンに応じた「1段階鮮やかなトーン」を参照
    // ただし sf はエレガントのトーン範囲外なので ltg ベースでも lt を返す
    const baseTone = input.baseColor?.toneSymbol
    let assortTone = "lt"
    if (baseTone === "p") assortTone = "lt"
    else if (baseTone === "ltg")
      assortTone = "lt" // sfではなくlt（エレガント固有ルール）
    else {
      const stepped = baseTone ? getOneStepMoreChromatic(baseTone) : null
      if (stepped && theme.allowedTones.includes(stepped)) assortTone = stepped
    }
    return { suggestedHues: hues, suggestedTones: [assortTone] }
  }

  // accent: 強調色NG（v, b, dp を除外）
  return { suggestedHues: hues, suggestedTones: ["p", "ltg", "lt"] }
}

function suggestCasual(input: SuggestInput, theme: ThemeDef): SuggestOutput {
  const allHues = theme.allowedHues

  if (input.role === "base") {
    return { suggestedHues: [3, 4, 5, 6, 7, 8], suggestedTones: ["p", "lt"] }
  }

  if (input.role === "assort") {
    const baseHue = input.baseColor?.hueNumber ?? null
    const suggested =
      baseHue !== null ? allHues.filter((h) => hueDistance(h, baseHue) >= 4) : allHues
    const result = suggested.length > 0 ? suggested : allHues
    return { suggestedHues: result, suggestedTones: ["p", "lt", "b", "s", "v"] }
  }

  // accent: ベースまたはアソートとの色相差が4以上
  const baseHue = input.baseColor?.hueNumber ?? null
  const assortHue = input.assortColor?.hueNumber ?? null
  const suggested = allHues.filter((h) => {
    const fromBase = baseHue !== null ? hueDistance(h, baseHue) >= 4 : true
    const fromAssort = assortHue !== null ? hueDistance(h, assortHue) >= 4 : true
    return fromBase || fromAssort
  })
  const result = suggested.length > 0 ? suggested : allHues
  return { suggestedHues: result, suggestedTones: ["b", "s", "v"] }
}

function suggestClassic(input: SuggestInput, theme: ThemeDef): SuggestOutput {
  const allHues = theme.allowedHues

  if (input.role === "base") {
    return { suggestedHues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], suggestedTones: ["dkg", "dk"] }
  }

  if (input.role === "assort") {
    const baseHue = input.baseColor?.hueNumber ?? null
    const suggested =
      baseHue !== null ? allHues.filter((h) => hueDistance(h, baseHue) <= 3) : allHues
    const result = suggested.length > 0 ? suggested : allHues
    return { suggestedHues: result, suggestedTones: ["g", "dk"] }
  }

  // accent: 緑〜青系の引き締め色
  return {
    suggestedHues: [11, 12, 13, 14, 15, 16, 17, 18],
    suggestedTones: ["dp", "Bk", "dkGy"]
  }
}

function suggestClear(input: SuggestInput): SuggestOutput {
  const hues = [14, 15, 16, 17, 18, 19]

  if (input.role === "base") {
    return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
  }

  if (input.role === "assort" || input.role === "accent") {
    const base = input.baseColor
    if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
    const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
    return { suggestedHues: hues, suggestedTones: tones }
  }

  return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
}

function suggestChic(input: SuggestInput, theme: ThemeDef): SuggestOutput {
  const hues = theme.allowedHues

  if (input.role === "base") {
    return { suggestedHues: hues, suggestedTones: ["Bk", "dkGy", "mGy", "g"] }
  }

  if (input.role === "assort") {
    const base = input.baseColor
    if (!base)
      return { suggestedHues: hues, suggestedTones: ["dkg", "dk", "ltg", "g", "Bk", "dkGy", "mGy"] }
    const tones = isAchromatic(base) ? ["dkg", "dk", "ltg", "g"] : ["Bk", "dkGy", "mGy"]
    return { suggestedHues: hues, suggestedTones: tones }
  }

  // accent: 強すぎない色（v, b, dp を除外）
  return { suggestedHues: hues, suggestedTones: ["dkg", "dk", "g", "ltg"] }
}

function suggestDynamic(): SuggestOutput {
  // 3色すべて同一条件
  return { suggestedHues: [2, 5, 8, 12, 18], suggestedTones: ["Bk", "b", "s", "v"] }
}

function suggestWarmNatural(input: SuggestInput): SuggestOutput {
  if (input.role === "base") {
    return { suggestedHues: [4, 5, 6, 7, 8], suggestedTones: ["p", "ltg", "sf", "d"] }
  }
  // assort / accent: 同一条件
  return {
    suggestedHues: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    suggestedTones: ["ltg", "sf", "d", "dk", "dp"]
  }
}

function suggestFreshNatural(input: SuggestInput): SuggestOutput {
  const hues = [9, 10, 11, 12, 13, 14, 15, 16]

  if (input.role === "base") {
    // b トーンはベースカラーとしてサジェストしない
    return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
  }

  // assort / accent: 動的サジェスト（アソートと同一条件）
  const base = input.baseColor
  if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
  const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
  return { suggestedHues: hues, suggestedTones: tones }
}

function suggestModern(input: SuggestInput): SuggestOutput {
  const hues = [16, 17, 18]

  if (input.role === "base") {
    return { suggestedHues: hues, suggestedTones: ["ltg", "ltGy", "mGy"] }
  }

  if (input.role === "assort") {
    return {
      suggestedHues: hues,
      suggestedTones: ["mGy", "dkGy", "Bk", "sf", "d", "b", "s", "dp", "v"]
    }
  }

  // accent: アソートの種別に応じて対になる色
  const assort = input.assortColor
  if (!assort)
    return {
      suggestedHues: hues,
      suggestedTones: ["sf", "d", "b", "s", "dp", "v", "mGy", "dkGy", "Bk"]
    }
  if (isAchromatic(assort)) {
    return { suggestedHues: hues, suggestedTones: ["sf", "d", "b", "s", "dp", "v"] }
  } else {
    return { suggestedHues: hues, suggestedTones: ["mGy", "dkGy", "Bk"] }
  }
}

function suggestRomantic(input: SuggestInput): SuggestOutput {
  const hues = [24, 1, 2, 3, 4, 5, 6, 7]

  if (input.role === "base") {
    // lt はアクセントカラー向けのため、ベースにはサジェストしない
    return { suggestedHues: hues, suggestedTones: ["p", "W", "ltGy"] }
  }

  // assort / accent: 動的サジェスト（アソートと同一条件）
  const base = input.baseColor
  if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }

  if (isAchromatic(base)) {
    return { suggestedHues: hues, suggestedTones: ["p", "lt"] }
  }

  // base が有彩色 (p) → 色相差 0〜3 の類似色
  const baseHue = base.hueNumber
  const similarHues = baseHue !== null ? hues.filter((h) => hueDistance(h, baseHue) <= 3) : hues
  const result = similarHues.length > 0 ? similarHues : hues
  return { suggestedHues: result, suggestedTones: ["p", "lt", "W", "ltGy"] }
}

// ===== メイン関数 =====

export function computeSuggest(input: SuggestInput): SuggestOutput {
  const theme = getThemeOrThrow(input.theme)

  let output: SuggestOutput
  switch (input.theme) {
    case "elegant":
      output = suggestElegant(input, theme)
      break
    case "casual":
      output = suggestCasual(input, theme)
      break
    case "classic":
      output = suggestClassic(input, theme)
      break
    case "clear":
      output = suggestClear(input)
      break
    case "chic":
      output = suggestChic(input, theme)
      break
    case "dynamic":
      output = suggestDynamic()
      break
    case "warm-natural":
      output = suggestWarmNatural(input)
      break
    case "fresh-natural":
      output = suggestFreshNatural(input)
      break
    case "modern":
      output = suggestModern(input)
      break
    case "romantic":
      output = suggestRomantic(input)
      break
    default: {
      const _exhaustive: never = input.theme
      throw new Error(`Unknown theme: ${_exhaustive}`)
    }
  }

  // フォールバック: 両配列が空の場合はテーマ全体をサジェスト
  if (output.suggestedHues.length === 0 && output.suggestedTones.length === 0) {
    return fallback(theme)
  }

  return output
}
