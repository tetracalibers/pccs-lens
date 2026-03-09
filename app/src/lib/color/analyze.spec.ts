import { describe, it, expect } from "vitest"
import { analyzeColors } from "./analyze"
import type { PCCSColor } from "$lib/data/types"

// ===== テスト用ヘルパー =====

function chromatic(hue: number, tone: string): PCCSColor {
  return {
    notation: `${tone}${hue}`,
    hex: "#000000",
    toneSymbol: tone,
    hueNumber: hue,
    isNeutral: false,
    achromaticBucket: null
  }
}

function neutral(bucket: "W" | "ltGy" | "mGy" | "dkGy" | "Bk"): PCCSColor {
  return {
    notation: bucket,
    hex: "#888888",
    toneSymbol: null,
    hueNumber: null,
    isNeutral: true,
    achromaticBucket: bucket
  }
}

function ids(colors: PCCSColor[]) {
  return analyzeColors(colors).map((c) => c.id)
}

// ===== hueDiff 相当のテスト（analyzeColors経由） =====

describe("色相の関係（2色）", () => {
  it("同一色相 → hue-same", () => {
    expect(ids([chromatic(2, "v"), chromatic(2, "lt")])).toContain("hue-same")
  })
  it("隣接色相（差1） → hue-adjacent", () => {
    expect(ids([chromatic(2, "v"), chromatic(3, "lt")])).toContain("hue-adjacent")
  })
  it("類似色相（差2〜3） → hue-similar", () => {
    expect(ids([chromatic(2, "v"), chromatic(4, "lt")])).toContain("hue-similar")
    expect(ids([chromatic(2, "v"), chromatic(5, "lt")])).toContain("hue-similar")
  })
  it("中差色相（差4〜7） → hue-medium", () => {
    expect(ids([chromatic(2, "v"), chromatic(6, "lt")])).toContain("hue-medium")
    expect(ids([chromatic(2, "v"), chromatic(9, "lt")])).toContain("hue-medium")
  })
  it("対照色相（差8〜10） → hue-contrast", () => {
    expect(ids([chromatic(2, "v"), chromatic(10, "lt")])).toContain("hue-contrast")
    expect(ids([chromatic(2, "v"), chromatic(12, "lt")])).toContain("hue-contrast")
  })
  it("補色色相（差11〜12） → hue-complement", () => {
    expect(ids([chromatic(2, "v"), chromatic(13, "lt")])).toContain("hue-complement")
    expect(ids([chromatic(2, "v"), chromatic(14, "lt")])).toContain("hue-complement")
  })
  it("色相差の計算が環状（24色相環）になっている", () => {
    // hue1とhue24の差は1
    expect(ids([chromatic(1, "v"), chromatic(24, "lt")])).toContain("hue-adjacent")
  })
  it("2色でも一方が無彩色なら色相カードは出ない", () => {
    expect(ids([chromatic(2, "v"), neutral("W")])).not.toContain("hue-same")
    expect(ids([chromatic(2, "v"), neutral("W")])).not.toContain("hue-complement")
  })
  it("3色以上では色相関係カードは出ない", () => {
    const result = ids([chromatic(2, "v"), chromatic(3, "lt"), chromatic(4, "b")])
    expect(result).not.toContain("hue-same")
    expect(result).not.toContain("hue-adjacent")
  })
})

describe("トーンの関係（2色）", () => {
  it("同一トーン → tone-same", () => {
    expect(ids([chromatic(2, "v"), chromatic(8, "v")])).toContain("tone-same")
  })
  it("類似トーン（b-v隣接） → tone-similar", () => {
    expect(ids([chromatic(2, "v"), chromatic(8, "b")])).toContain("tone-similar")
  })
  it("対照トーン → tone-contrast", () => {
    // p（低彩度高明度）と dk（中彩度低明度）は非隣接
    expect(ids([chromatic(2, "p"), chromatic(8, "dk")])).toContain("tone-contrast")
  })
  it("3色以上ではトーン関係カードは出ない", () => {
    const result = ids([chromatic(2, "v"), chromatic(3, "v"), chromatic(4, "v")])
    expect(result).not.toContain("tone-same")
  })
})

// ===== ハーモニー =====

describe("ハーモニー（2色）", () => {
  it("黄側が明るく、紫側が暗い → ナチュラルハーモニー", () => {
    // hue8=黄(p=明るい) + hue20=紫(dk=暗い)
    expect(ids([chromatic(8, "p"), chromatic(20, "dk")])).toContain("harmony-natural")
  })
  it("紫側が明るく、黄側が暗い → コンプレックスハーモニー", () => {
    // hue20=紫(p=明るい) + hue8=黄(dk=暗い)
    expect(ids([chromatic(20, "p"), chromatic(8, "dk")])).toContain("harmony-complex")
  })
  it("両色が同じ側（両方黄側）ではハーモニーカードは出ない", () => {
    // hue6,hue10 はどちらも黄側
    const result = ids([chromatic(6, "p"), chromatic(10, "dk")])
    expect(result).not.toContain("harmony-natural")
    expect(result).not.toContain("harmony-complex")
  })
  it("2色でも有彩色が1色以下ではハーモニーカードは出ない", () => {
    const result = ids([chromatic(8, "p"), neutral("W")])
    expect(result).not.toContain("harmony-natural")
    expect(result).not.toContain("harmony-complex")
  })
})

// ===== 配色技法 =====

describe("ドミナントカラー", () => {
  it("全色が類似色相内（差≤3） → 該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(4, "lt"), chromatic(5, "b")])).toContain(
      "tech-dominant-color"
    )
  })
  it("差が4以上のペアがある → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(6, "lt")])).not.toContain("tech-dominant-color")
  })
  it("無彩色が含まれる → 非該当", () => {
    expect(ids([chromatic(2, "v"), neutral("W")])).not.toContain("tech-dominant-color")
  })
})

describe("ドミナントトーン", () => {
  it("全色が同一トーン → 該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(8, "v"), chromatic(14, "v")])).toContain(
      "tech-dominant-tone"
    )
  })
  it("全色が類似トーン → 該当", () => {
    // v と b は隣接
    expect(ids([chromatic(2, "v"), chromatic(8, "b")])).toContain("tech-dominant-tone")
  })
  it("対照トーンのペアがある → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(8, "p")])).not.toContain("tech-dominant-tone")
  })
})

describe("トーンオントーン", () => {
  it("同一・類似色相かつ同一列の異なるトーン → 該当", () => {
    // lt と dk は同一列（列2）、hue差は0
    expect(ids([chromatic(2, "lt"), chromatic(2, "dk")])).toContain("tech-tone-on-tone")
  })
  it("同一色相でも異なる列 → 非該当", () => {
    // lt（列2）と b（列3）
    expect(ids([chromatic(2, "lt"), chromatic(2, "b")])).not.toContain("tech-tone-on-tone")
  })
  it("無彩色が含まれる → 非該当", () => {
    expect(ids([chromatic(2, "lt"), neutral("W")])).not.toContain("tech-tone-on-tone")
  })
})

describe("トーナル", () => {
  it("全色が中間色トーン → 該当", () => {
    expect(ids([chromatic(2, "ltg"), chromatic(8, "sf"), chromatic(14, "d")])).toContain(
      "tech-tonal"
    )
  })
  it("中間色以外が混ざる → 非該当", () => {
    expect(ids([chromatic(2, "ltg"), chromatic(8, "v")])).not.toContain("tech-tonal")
  })
})

describe("カマイユ", () => {
  it("同一色相かつ隣接トーン → 該当", () => {
    // hue差0、v-b隣接
    expect(ids([chromatic(2, "v"), chromatic(2, "b")])).toContain("tech-camaieu")
  })
  it("色相差2 → 非該当（フォカマイユの領域）", () => {
    expect(ids([chromatic(2, "v"), chromatic(4, "b")])).not.toContain("tech-camaieu")
  })
})

describe("フォカマイユ", () => {
  it("類似色相（差2〜3）かつ類似トーン → 該当", () => {
    // hue差2、v-b隣接
    expect(ids([chromatic(2, "v"), chromatic(4, "b")])).toContain("tech-faux-camaieu")
  })
  it("色相差が1以下 → 非該当（カマイユの領域）", () => {
    expect(ids([chromatic(2, "v"), chromatic(3, "b")])).not.toContain("tech-faux-camaieu")
  })
  it("色相差が4以上 → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(6, "b")])).not.toContain("tech-faux-camaieu")
  })
})

describe("ビコロール", () => {
  it("補色・高彩度2色 → 該当", () => {
    // hue2とhue14: 差12、どちらもv
    expect(ids([chromatic(2, "v"), chromatic(14, "v")])).toContain("tech-bicolor")
  })
  it("対照色相（差8）・高彩度2色 → 該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(10, "b")])).toContain("tech-bicolor")
  })
  it("高彩度でないトーンが含まれる → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(14, "lt")])).not.toContain("tech-bicolor")
  })
  it("3色 → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(14, "v"), chromatic(8, "v")])).not.toContain(
      "tech-bicolor"
    )
  })
})

describe("トリコロール", () => {
  it("3色すべてが互いに対照・補色で高彩度 → 該当", () => {
    // hue2, hue10, hue18: 差8,8,8
    expect(ids([chromatic(2, "v"), chromatic(10, "v"), chromatic(18, "v")])).toContain(
      "tech-tricolor"
    )
  })
  it("1ペアの差が8未満 → 非該当", () => {
    expect(ids([chromatic(2, "v"), chromatic(8, "v"), chromatic(18, "v")])).not.toContain(
      "tech-tricolor"
    )
  })
})

// ===== 色相環の分割 =====

describe("ダイアード", () => {
  it("色相差12 → 該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(14, "lt")])).toContain("div-dyad")
  })
  it("色相差11 → 該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(13, "lt")])).toContain("div-dyad")
  })
  it("色相差10 → 非該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(12, "lt")])).not.toContain("div-dyad")
  })
})

describe("トライアド", () => {
  it("3色が等間隔（差8,8,8） → 該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(10, "lt"), chromatic(18, "lt")])).toContain(
      "div-triad"
    )
  })
  it("差が範囲外 → 非該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(4, "lt"), chromatic(20, "lt")])).not.toContain(
      "div-triad"
    )
  })
})

describe("スプリットコンプリメンタリー", () => {
  it("主色2の補色14の両隣(13,15) → 該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(13, "lt"), chromatic(15, "lt")])).toContain(
      "div-split-comp"
    )
  })
  it("副色が補色から3離れている → 非該当", () => {
    expect(ids([chromatic(2, "lt"), chromatic(11, "lt"), chromatic(17, "lt")])).not.toContain(
      "div-split-comp"
    )
  })
})

describe("テトラード", () => {
  it("4色が等間隔（差6,6,6,6） → 該当", () => {
    expect(
      ids([chromatic(2, "lt"), chromatic(8, "lt"), chromatic(14, "lt"), chromatic(20, "lt")])
    ).toContain("div-tetrad")
  })
  it("差が範囲外 → 非該当", () => {
    expect(
      ids([chromatic(2, "lt"), chromatic(5, "lt"), chromatic(14, "lt"), chromatic(20, "lt")])
    ).not.toContain("div-tetrad")
  })
})

describe("ペンタード", () => {
  it("5色が等間隔（差約5） → 該当", () => {
    // hue 2,7,12,17,22: diffs 5,5,5,5,4
    expect(
      ids([
        chromatic(2, "lt"),
        chromatic(7, "lt"),
        chromatic(12, "lt"),
        chromatic(17, "lt"),
        chromatic(22, "lt")
      ])
    ).toContain("div-pentad")
  })
  it("有彩色3色（トライアド）＋W＋Bk → 該当", () => {
    expect(
      ids([chromatic(2, "v"), chromatic(10, "v"), chromatic(18, "v"), neutral("W"), neutral("Bk")])
    ).toContain("div-pentad")
  })
})

describe("ヘクサード", () => {
  it("6色が等間隔（差4） → 該当", () => {
    expect(
      ids([
        chromatic(2, "lt"),
        chromatic(6, "lt"),
        chromatic(10, "lt"),
        chromatic(14, "lt"),
        chromatic(18, "lt"),
        chromatic(22, "lt")
      ])
    ).toContain("div-hexad")
  })
  it("有彩色4色（テトラード）＋W＋Bk → 該当", () => {
    expect(
      ids([
        chromatic(2, "v"),
        chromatic(8, "v"),
        chromatic(14, "v"),
        chromatic(20, "v"),
        neutral("W"),
        neutral("Bk")
      ])
    ).toContain("div-hexad")
  })
})

describe("該当なし", () => {
  it("analyzeColorsが空配列を返すケースも存在しうる（エラーにならない）", () => {
    // 無彩色2色：色相カード・ハーモニーは出ないが tone 関係カードは出る
    const result = analyzeColors([neutral("W"), neutral("Bk")])
    expect(result).toBeInstanceOf(Array)
  })
})
