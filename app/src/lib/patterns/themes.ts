import { isAchromaticTone } from "./lookup"
import type { SelectedColor, SuggestOutput, ThemeDef, ThemeId } from "./types"

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

// ===== テーマ定義 =====

export const THEMES: ThemeDef[] = [
  {
    id: "elegant",
    labelJa: "エレガント",
    labelEn: "Elegant",
    imageDescription: "女性的な・気品のある・洗練された・優雅な",
    coloringDescription:
      "パープル系の明清色・高明度中間色の組み合わせ。明度差を抑えた上品なコントラスト。",
    allowedHues: [19, 20, 21, 22, 23, 24, 1],
    allowedTones: ["p", "ltg", "lt", "b"],
    isDynamic: false,
    roleDescriptions: {
      base: "紫〜赤紫系の淡いパープル（pトーン・ltgトーン）",
      assort: "ベースと同じ色相グループから、ひとつ鮮やかなトーンの色",
      accent: "ベース・アソートと調和する、控えめなトーンの色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [19, 20, 21, 22, 23, 24, 1],
        suggestedTones: ["p", "ltg"]
      }),
      assort: (base): SuggestOutput => {
        const allowedTones = ["p", "ltg", "lt", "b"]
        const baseTone = base?.toneSymbol
        let assortTone = "lt"
        if (baseTone === "p") assortTone = "lt"
        else if (baseTone === "ltg")
          assortTone = "lt" // sfではなくlt（エレガント固有ルール）
        else {
          const stepped = baseTone ? getOneStepMoreChromatic(baseTone) : null
          if (stepped && allowedTones.includes(stepped)) assortTone = stepped
        }
        return { suggestedHues: [19, 20, 21, 22, 23, 24, 1], suggestedTones: [assortTone] }
      },
      accent: (): SuggestOutput => ({
        suggestedHues: [19, 20, 21, 22, 23, 24, 1],
        suggestedTones: ["p", "ltg", "lt"]
      })
    }
  },
  {
    id: "casual",
    labelJa: "カジュアル",
    labelEn: "Casual",
    imageDescription: "明るい・活発な・親しみやすい",
    coloringDescription: "純色から明清色の範囲で、色相対比のある明るい配色。",
    allowedHues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    allowedTones: ["p", "lt", "b", "s", "v"],
    isDynamic: false,
    roleDescriptions: {
      base: "橙〜黄系の明るい色（pトーン・ltトーン）",
      assort: "ベースと色相対比が生まれる色（色相差4以上）",
      accent: "全体を引き締める高彩度色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [3, 4, 5, 6, 7, 8],
        suggestedTones: ["p", "lt"]
      }),
      assort: (base): SuggestOutput => {
        const allHues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
        const baseHue = base?.hueNumber ?? null
        const suggested =
          baseHue !== null ? allHues.filter((h) => hueDistance(h, baseHue) >= 4) : allHues
        const result = suggested.length > 0 ? suggested : allHues
        return { suggestedHues: result, suggestedTones: ["p", "lt", "b", "s", "v"] }
      },
      accent: (base, assort): SuggestOutput => {
        const allHues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
        const baseHue = base?.hueNumber ?? null
        const assortHue = assort?.hueNumber ?? null
        const suggested = allHues.filter((h) => {
          const fromBase = baseHue !== null ? hueDistance(h, baseHue) >= 4 : true
          const fromAssort = assortHue !== null ? hueDistance(h, assortHue) >= 4 : true
          return fromBase || fromAssort
        })
        const result = suggested.length > 0 ? suggested : allHues
        return { suggestedHues: result, suggestedTones: ["b", "s", "v"] }
      }
    }
  },
  {
    id: "classic",
    labelJa: "クラシック",
    labelEn: "Classic",
    imageDescription: "重厚な・円熟した・伝統的な",
    coloringDescription: "暗く落ち着いた色調。ブラウン系に別の色相を添える演出。",
    allowedHues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    allowedTones: ["g", "dkg", "dk", "dp", "Bk", "dkGy"],
    isDynamic: false,
    roleDescriptions: {
      base: "茶系の深みある色（dkg・dkトーン）",
      assort: "ベースと同系色の落ち着いたトーン",
      accent: "緑〜青系の引き締め色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        suggestedTones: ["dkg", "dk"]
      }),
      assort: (base): SuggestOutput => {
        const allHues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
        const baseHue = base?.hueNumber ?? null
        const suggested =
          baseHue !== null ? allHues.filter((h) => hueDistance(h, baseHue) <= 3) : allHues
        const result = suggested.length > 0 ? suggested : allHues
        return { suggestedHues: result, suggestedTones: ["g", "dk"] }
      },
      accent: (): SuggestOutput => ({
        suggestedHues: [11, 12, 13, 14, 15, 16, 17, 18],
        suggestedTones: ["dp", "Bk", "dkGy"]
      })
    }
  },
  {
    id: "clear",
    labelJa: "クリア",
    labelEn: "Clear",
    imageDescription: "明るい・爽やかな・透明感のある",
    coloringDescription: "BG〜B系寒色の明清色とホワイト系の組み合わせ。",
    allowedHues: [14, 15, 16, 17, 18, 19],
    allowedTones: ["p", "lt", "W", "ltGy"],
    isDynamic: false,
    roleDescriptions: {
      base: "青緑〜青系の澄んだ色、またはホワイト系",
      assort: "ベースが有彩色ならホワイト系、ホワイト系なら有彩色",
      accent: "テーマの清潔感を保つ、控えめなトーンの色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [14, 15, 16, 17, 18, 19],
        suggestedTones: ["p", "lt", "W", "ltGy"]
      }),
      assort: (base): SuggestOutput => {
        const hues = [14, 15, 16, 17, 18, 19]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
        return { suggestedHues: hues, suggestedTones: tones }
      },
      accent: (base): SuggestOutput => {
        const hues = [14, 15, 16, 17, 18, 19]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
        return { suggestedHues: hues, suggestedTones: tones }
      }
    }
  },
  {
    id: "chic",
    labelJa: "シック",
    labelEn: "Chic",
    imageDescription: "渋い・洗練された・大人っぽい",
    coloringDescription: "やや色みを感じさせる無彩色系の組み合わせ。高彩度色は含まない。",
    allowedHues: [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    allowedTones: ["dkg", "dk", "g", "ltg", "Bk", "dkGy", "mGy"],
    isDynamic: false,
    roleDescriptions: {
      base: "無彩色（黒・グレー）または渋みのある低彩度色",
      assort: "ベースが無彩色なら有彩色、有彩色なら無彩色",
      accent: "テーマの落ち着きを損なわない渋みある色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        suggestedTones: ["Bk", "dkGy", "mGy", "g"]
      }),
      assort: (base): SuggestOutput => {
        const hues = [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        if (!base)
          return {
            suggestedHues: hues,
            suggestedTones: ["dkg", "dk", "ltg", "g", "Bk", "dkGy", "mGy"]
          }
        const tones = isAchromatic(base) ? ["dkg", "dk", "ltg", "g"] : ["Bk", "dkGy", "mGy"]
        return { suggestedHues: hues, suggestedTones: tones }
      },
      accent: (): SuggestOutput => ({
        suggestedHues: [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        suggestedTones: ["dkg", "dk", "g", "ltg"]
      })
    }
  },
  {
    id: "dynamic",
    labelJa: "ダイナミック",
    labelEn: "Dynamic",
    imageDescription: "強い・はっきりした・派手な",
    coloringDescription: "心理四原色とオレンジ系の高彩度色による色相対比。",
    allowedHues: [2, 5, 8, 12, 18],
    allowedTones: ["Bk", "b", "s", "v"],
    isDynamic: true,
    roleDescriptions: {
      base: "赤・橙・黄・緑・青のいずれかの高彩度色または黒",
      assort: "ベースとは異なる色相の高彩度色",
      accent: "さらに別の色相を加えて力強いコントラストを完成させる色"
    },
    rules: {
      // 3色すべて同一条件
      base: (): SuggestOutput => ({
        suggestedHues: [2, 5, 8, 12, 18],
        suggestedTones: ["Bk", "b", "s", "v"]
      }),
      assort: (): SuggestOutput => ({
        suggestedHues: [2, 5, 8, 12, 18],
        suggestedTones: ["Bk", "b", "s", "v"]
      }),
      accent: (): SuggestOutput => ({
        suggestedHues: [2, 5, 8, 12, 18],
        suggestedTones: ["Bk", "b", "s", "v"]
      })
    }
  },
  {
    id: "warm-natural",
    labelJa: "ウォームナチュラル",
    labelEn: "Warm Natural",
    imageDescription: "穏やかな・素朴な・温もりのある",
    coloringDescription: "自然環境色（山・田園）の穏やかなトーン。オレンジ系からグリーン系の範囲。",
    allowedHues: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    allowedTones: ["p", "ltg", "sf", "d", "dk", "dp"],
    isDynamic: false,
    roleDescriptions: {
      base: "橙〜黄系の自然を感じる穏やかな色",
      assort: "大地・草木を連想させる自然の色",
      accent: "アソートと同じ基準で選ぶ穏やかな色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [4, 5, 6, 7, 8],
        suggestedTones: ["p", "ltg", "sf", "d"]
      }),
      // assort・accent は同一条件
      assort: (): SuggestOutput => ({
        suggestedHues: [4, 5, 6, 7, 8, 9, 10, 11, 12],
        suggestedTones: ["ltg", "sf", "d", "dk", "dp"]
      }),
      accent: (): SuggestOutput => ({
        suggestedHues: [4, 5, 6, 7, 8, 9, 10, 11, 12],
        suggestedTones: ["ltg", "sf", "d", "dk", "dp"]
      })
    }
  },
  {
    id: "fresh-natural",
    labelJa: "フレッシュナチュラル",
    labelEn: "Fresh Natural",
    imageDescription: "若々しい・新鮮な・爽やかな",
    coloringDescription: "イエローグリーン〜ブルーグリーン系の明清色中心。",
    allowedHues: [9, 10, 11, 12, 13, 14, 15, 16],
    allowedTones: ["p", "lt", "b", "W", "ltGy"],
    isDynamic: false,
    roleDescriptions: {
      base: "黄緑〜青緑系の爽やかな色、またはホワイト系",
      assort: "ベースが有彩色ならホワイト系、ホワイト系なら有彩色",
      accent: "アソートと同じ基準で選ぶ清潔感のある色"
    },
    rules: {
      base: (): SuggestOutput => ({
        // bトーンはベースカラーとしてサジェストしない
        suggestedHues: [9, 10, 11, 12, 13, 14, 15, 16],
        suggestedTones: ["p", "lt", "W", "ltGy"]
      }),
      // assort・accent は同一条件（baseの有彩・無彩に応じて動的に変化）
      assort: (base): SuggestOutput => {
        const hues = [9, 10, 11, 12, 13, 14, 15, 16]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
        return { suggestedHues: hues, suggestedTones: tones }
      },
      accent: (base): SuggestOutput => {
        const hues = [9, 10, 11, 12, 13, 14, 15, 16]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        const tones = isAchromatic(base) ? ["p", "lt"] : ["W", "ltGy"]
        return { suggestedHues: hues, suggestedTones: tones }
      }
    }
  },
  {
    id: "modern",
    labelJa: "モダン",
    labelEn: "Modern",
    imageDescription: "現代的・人工的",
    coloringDescription:
      "金属・ガラス・コンクリートの都会的なイメージ。無彩色のハイコントラストにブルー系有彩色を組み合わせる。",
    allowedHues: [16, 17, 18],
    allowedTones: ["ltg", "sf", "d", "b", "s", "dp", "v", "W", "ltGy", "mGy", "dkGy", "Bk"],
    isDynamic: false,
    roleDescriptions: {
      base: "青系の彩度を抑えた色（ltgトーン）またはライトグレー",
      assort: "濃いグレー・黒などの無彩色、または青系の有彩色",
      accent: "アソートとは反対の種別（無彩色↔有彩色）の色"
    },
    rules: {
      base: (): SuggestOutput => ({
        suggestedHues: [16, 17, 18],
        suggestedTones: ["ltg", "ltGy", "mGy"]
      }),
      assort: (): SuggestOutput => ({
        suggestedHues: [16, 17, 18],
        suggestedTones: ["mGy", "dkGy", "Bk", "sf", "d", "b", "s", "dp", "v"]
      }),
      accent: (_base, assort): SuggestOutput => {
        const hues = [16, 17, 18]
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
    }
  },
  {
    id: "romantic",
    labelJa: "ロマンチック",
    labelEn: "Romantic",
    imageDescription: "かわいい・可憐な・愛らしい",
    coloringDescription:
      "赤紫〜赤みの黄まで、p・lt トーンのやわらかな配色。ピンク（赤系の p, lt）が特に有効。",
    allowedHues: [24, 1, 2, 3, 4, 5, 6, 7],
    allowedTones: ["p", "lt", "W", "ltGy"],
    isDynamic: false,
    roleDescriptions: {
      base: "赤紫〜橙系のパステルカラー、またはホワイト系",
      assort: "ベースと近い色相の、やわらかなトーンの色",
      accent: "アソートと同じ基準で選ぶかわいらしい色"
    },
    rules: {
      base: (): SuggestOutput => ({
        // ltはアクセントカラー向けのため、ベースにはサジェストしない
        suggestedHues: [24, 1, 2, 3, 4, 5, 6, 7],
        suggestedTones: ["p", "W", "ltGy"]
      }),
      // assort・accent は同一条件（baseの有彩・無彩と色相に応じて動的に変化）
      assort: (base): SuggestOutput => {
        const hues = [24, 1, 2, 3, 4, 5, 6, 7]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        if (isAchromatic(base)) return { suggestedHues: hues, suggestedTones: ["p", "lt"] }
        // base が有彩色（p）→ 色相差 0〜3 の類似色
        const baseHue = base.hueNumber
        const similarHues =
          baseHue !== null ? hues.filter((h) => hueDistance(h, baseHue) <= 3) : hues
        const result = similarHues.length > 0 ? similarHues : hues
        return { suggestedHues: result, suggestedTones: ["p", "lt", "W", "ltGy"] }
      },
      accent: (base): SuggestOutput => {
        const hues = [24, 1, 2, 3, 4, 5, 6, 7]
        if (!base) return { suggestedHues: hues, suggestedTones: ["p", "lt", "W", "ltGy"] }
        if (isAchromatic(base)) return { suggestedHues: hues, suggestedTones: ["p", "lt"] }
        const baseHue = base.hueNumber
        const similarHues =
          baseHue !== null ? hues.filter((h) => hueDistance(h, baseHue) <= 3) : hues
        const result = similarHues.length > 0 ? similarHues : hues
        return { suggestedHues: result, suggestedTones: ["p", "lt", "W", "ltGy"] }
      }
    }
  }
]

export function getTheme(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getThemeOrThrow(id: ThemeId): ThemeDef {
  const theme = getTheme(id)
  if (!theme) throw new Error(`Unknown theme: ${id}`)
  return theme
}
