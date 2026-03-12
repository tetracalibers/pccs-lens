import type { ThemeDef, ThemeId } from "./types"

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
