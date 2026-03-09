import type { PCCSColor } from "$lib/data/types"

export type AnalysisCard = {
  id: string
  title: string
  description: string
  category: string
}

// ===== ユーティリティ =====

function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2)
  return Math.min(d, 24 - d)
}

const TONE_RANK: Record<string, number> = {
  W: 0,
  p: 0.5,
  lt: 0.5,
  b: 1.0,
  ltGy: 1.0,
  ltg: 1.5,
  sf: 1.5,
  v: 2.0,
  s: 2.0,
  mGy: 2.0,
  g: 2.5,
  d: 2.5,
  dp: 3.0,
  dkGy: 3.0,
  dk: 3.5,
  dkg: 3.5,
  Bk: 4.0
}

function toneRank(color: PCCSColor): number {
  if (color.isNeutral && color.achromaticBucket) return TONE_RANK[color.achromaticBucket] ?? 2.0
  return color.toneSymbol ? (TONE_RANK[color.toneSymbol] ?? 2.0) : 2.0
}

const TONE_ADJACENCY: Record<string, string[]> = {
  v: ["b", "dp"],
  b: ["v", "lt", "sf"],
  lt: ["p", "b", "ltg", "sf"],
  dp: ["v", "d", "dk"],
  d: ["sf", "dk", "dp", "ltg", "g"],
  dk: ["d", "dp", "g", "dkg"],
  sf: ["lt", "b", "ltg", "d", "p", "g"],
  p: ["lt", "ltg", "sf"],
  ltg: ["p", "lt", "sf", "g", "d"],
  g: ["ltg", "sf", "dkg", "d", "dk"],
  dkg: ["g", "d", "dk"]
}

const ACHROMATIC_ADJACENCY: Record<string, string[]> = {
  W: ["ltGy"],
  ltGy: ["W", "mGy"],
  mGy: ["ltGy", "dkGy"],
  dkGy: ["mGy", "Bk"],
  Bk: ["dkGy"]
}

function getToneKey(color: PCCSColor): string | null {
  if (color.isNeutral) return color.achromaticBucket ?? null
  return color.toneSymbol
}

function toneRelation(c1: PCCSColor, c2: PCCSColor): "same" | "similar" | "contrast" {
  const t1 = getToneKey(c1)
  const t2 = getToneKey(c2)
  if (!t1 || !t2) return "contrast"
  if (t1 === t2) return "same"
  if (c1.isNeutral && c2.isNeutral) {
    return ACHROMATIC_ADJACENCY[t1]?.includes(t2) ? "similar" : "contrast"
  }
  if (!c1.isNeutral && !c2.isNeutral) {
    return TONE_ADJACENCY[t1]?.includes(t2) ? "similar" : "contrast"
  }
  return "contrast"
}

const TONE_COLUMN: Record<string, number> = {
  p: 1,
  ltg: 1,
  g: 1,
  dkg: 1,
  lt: 2,
  sf: 2,
  d: 2,
  dk: 2,
  b: 3,
  s: 3,
  dp: 3,
  v: 4
}

const HIGH_CHROMA_TONES = new Set(["v", "b", "dp"])

function isHighChromaOrNeutral(color: PCCSColor): boolean {
  return color.isNeutral || (color.toneSymbol !== null && HIGH_CHROMA_TONES.has(color.toneSymbol))
}

function allHueDiffs(chromatics: PCCSColor[]): number[] {
  const diffs: number[] = []
  for (let i = 0; i < chromatics.length; i++) {
    for (let j = i + 1; j < chromatics.length; j++) {
      diffs.push(hueDiff(chromatics[i].hueNumber!, chromatics[j].hueNumber!))
    }
  }
  return diffs
}

// ===== 2色専用カード生成 =====

function getHueRelationCard(colors: PCCSColor[]): AnalysisCard | null {
  if (colors.length !== 2) return null
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 2) return null
  const diff = hueDiff(chromatics[0].hueNumber!, chromatics[1].hueNumber!)
  if (diff === 0)
    return {
      id: "hue-same",
      title: "同一色相",
      category: "色相の関係",
      description: "2色が同じ色相。統一感があり穏やかにまとまる配色。"
    }
  if (diff === 1)
    return {
      id: "hue-adjacent",
      title: "隣接色相",
      category: "色相の関係",
      description: `色相差${diff}。ほぼ同一の色相で、わずかな変化による自然なまとまり。`
    }
  if (diff <= 3)
    return {
      id: "hue-similar",
      title: "類似色相",
      category: "色相の関係",
      description: `色相差${diff}。近い色相同士でまとめた、統一感のある穏やかな配色。`
    }
  if (diff <= 7)
    return {
      id: "hue-medium",
      title: "中差色相",
      category: "色相の関係",
      description: `色相差${diff}。適度なコントラストがあり、動きと変化を感じる配色。`
    }
  if (diff <= 10)
    return {
      id: "hue-contrast",
      title: "対照色相",
      category: "色相の関係",
      description: `色相差${diff}。はっきりとした対比で、強くダイナミックな印象。`
    }
  return {
    id: "hue-complement",
    title: "補色色相",
    category: "色相の関係",
    description: `色相差${diff}。最大の色相対比。互いを最も際立たせ、鮮やかに見せる配色。`
  }
}

function getToneRelationCard(colors: PCCSColor[]): AnalysisCard | null {
  if (colors.length !== 2) return null
  const rel = toneRelation(colors[0], colors[1])
  if (rel === "same")
    return {
      id: "tone-same",
      title: "同一トーン",
      category: "トーンの関係",
      description: "同じトーン同士の組み合わせ。統一感がありまとまりのある配色。"
    }
  if (rel === "similar")
    return {
      id: "tone-similar",
      title: "類似トーン",
      category: "トーンの関係",
      description: "トーン概念図上で隣接するトーン同士の組み合わせ。調和が取れた穏やかな印象。"
    }
  return {
    id: "tone-contrast",
    title: "対照トーン",
    category: "トーンの関係",
    description: "トーン概念図上で離れたトーンの組み合わせ。明暗・彩度差によるダイナミックな印象。"
  }
}

function getHarmonyCards(colors: PCCSColor[]): AnalysisCard[] {
  if (colors.length !== 2) return []
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 2) return []
  const h1 = chromatics[0].hueNumber!
  const h2 = chromatics[1].hueNumber!
  function hueDistTo(h: number, target: number): number {
    const d = Math.abs(h - target)
    return Math.min(d, 24 - d)
  }
  const c1IsYellow = hueDistTo(h1, 8) < hueDistTo(h1, 20)
  const c2IsYellow = hueDistTo(h2, 8) < hueDistTo(h2, 20)
  if (c1IsYellow === c2IsYellow) return []
  const yellowColor = c1IsYellow ? chromatics[0] : chromatics[1]
  const purpleColor = c1IsYellow ? chromatics[1] : chromatics[0]
  const yr = toneRank(yellowColor)
  const pr = toneRank(purpleColor)
  if (yr === pr) return []
  if (yr < pr)
    return [
      {
        id: "harmony-natural",
        title: "ナチュラルハーモニー",
        category: "色相の自然連鎖",
        description:
          "黄側の色が紫側の色より明るいトーンにある配色。自然界の明暗関係に従った、調和のとれた組み合わせ。"
      }
    ]
  return [
    {
      id: "harmony-complex",
      title: "コンプレックスハーモニー",
      category: "色相の自然連鎖",
      description:
        "紫側の色が黄側の色より明るいトーンにある配色。自然な明暗関係を逆転させた、複雑でアーティスティックな印象。"
    }
  ]
}

// ===== 配色技法の判定 =====

function checkDominantColor(colors: PCCSColor[]): boolean {
  if (colors.some((c) => c.isNeutral)) return false
  const chromatics = colors.filter((c) => c.hueNumber !== null)
  if (chromatics.length < 2) return false
  return allHueDiffs(chromatics).every((d) => d <= 3)
}

function checkDominantTone(colors: PCCSColor[]): boolean {
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (toneRelation(colors[i], colors[j]) === "contrast") return false
    }
  }
  return true
}

function checkToneOnTone(colors: PCCSColor[]): boolean {
  if (colors.some((c) => c.isNeutral || !c.toneSymbol)) return false
  if (!allHueDiffs(colors as PCCSColor[]).every((d) => d <= 3)) return false
  const cols = colors.map((c) => TONE_COLUMN[c.toneSymbol!])
  if (cols.some((c) => c === undefined)) return false
  if (new Set(cols).size !== 1) return false
  const tones = colors.map((c) => c.toneSymbol!)
  return new Set(tones).size === tones.length
}

function checkTonal(colors: PCCSColor[]): boolean {
  const TONAL_TONES = new Set(["ltg", "g", "sf", "d"])
  return colors.every((c) => !c.isNeutral && c.toneSymbol !== null && TONAL_TONES.has(c.toneSymbol))
}

function checkCamaieu(colors: PCCSColor[]): boolean {
  if (colors.some((c) => c.isNeutral)) return false
  const chromatics = colors.filter((c) => c.hueNumber !== null)
  if (chromatics.length < 2) return false
  if (!allHueDiffs(chromatics).every((d) => d <= 1)) return false
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (toneRelation(colors[i], colors[j]) === "contrast") return false
    }
  }
  return true
}

function checkFauxCamaieu(colors: PCCSColor[]): boolean {
  if (colors.some((c) => c.isNeutral)) return false
  const chromatics = colors.filter((c) => c.hueNumber !== null)
  if (chromatics.length < 2) return false
  if (!allHueDiffs(chromatics).every((d) => d >= 2 && d <= 3)) return false
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (toneRelation(colors[i], colors[j]) === "contrast") return false
    }
  }
  return true
}

function checkBicolor(colors: PCCSColor[]): boolean {
  if (colors.length !== 2) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 2) return false
  if (hueDiff(chromatics[0].hueNumber!, chromatics[1].hueNumber!) < 8) return false
  return colors.every((c) => isHighChromaOrNeutral(c))
}

function checkTricolor(colors: PCCSColor[]): boolean {
  if (colors.length !== 3) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 3) return false
  if (!allHueDiffs(chromatics).every((d) => d >= 8)) return false
  return colors.every((c) => isHighChromaOrNeutral(c))
}

// ===== 色相環分割系の判定 =====

function hueCircularDiffs(chromatics: PCCSColor[]): number[] {
  const hues = chromatics.map((c) => c.hueNumber!).sort((a, b) => a - b)
  return hues.map((h, i) => {
    const next = hues[(i + 1) % hues.length]
    return i < hues.length - 1 ? next - h : 24 - h + hues[0]
  })
}

function checkDyad(colors: PCCSColor[]): boolean {
  if (colors.length !== 2) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 2) return false
  return hueDiff(chromatics[0].hueNumber!, chromatics[1].hueNumber!) >= 11
}

function checkTriad(colors: PCCSColor[]): boolean {
  if (colors.length !== 3) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 3) return false
  return hueCircularDiffs(chromatics).every((d) => d >= 6 && d <= 10)
}

function checkSplitComplementary(colors: PCCSColor[]): boolean {
  if (colors.length !== 3) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 3) return false
  for (let i = 0; i < 3; i++) {
    const mainHue = chromatics[i].hueNumber!
    const subs = chromatics.filter((_, idx) => idx !== i)
    const exactComp = mainHue <= 12 ? mainHue + 12 : mainHue - 12
    const d0 = hueDiff(subs[0].hueNumber!, exactComp)
    const d1 = hueDiff(subs[1].hueNumber!, exactComp)
    if (d0 >= 1 && d0 <= 2 && d1 >= 1 && d1 <= 2) return true
  }
  return false
}

function checkTetrad(colors: PCCSColor[]): boolean {
  if (colors.length !== 4) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length !== 4) return false
  return hueCircularDiffs(chromatics).every((d) => d >= 4 && d <= 8)
}

function checkPentad(colors: PCCSColor[]): boolean {
  if (colors.length !== 5) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length === 5) {
    return hueCircularDiffs(chromatics).every((d) => d >= 3 && d <= 7)
  }
  if (chromatics.length === 3) {
    const hasW = colors.some((c) => c.isNeutral && c.achromaticBucket === "W")
    const hasBk = colors.some((c) => c.isNeutral && c.achromaticBucket === "Bk")
    if (hasW && hasBk) return checkTriad(chromatics)
  }
  return false
}

function checkHexad(colors: PCCSColor[]): boolean {
  if (colors.length !== 6) return false
  const chromatics = colors.filter((c) => !c.isNeutral && c.hueNumber !== null)
  if (chromatics.length === 6) {
    return hueCircularDiffs(chromatics).every((d) => d >= 2 && d <= 6)
  }
  if (chromatics.length === 4) {
    const hasW = colors.some((c) => c.isNeutral && c.achromaticBucket === "W")
    const hasBk = colors.some((c) => c.isNeutral && c.achromaticBucket === "Bk")
    if (hasW && hasBk) return checkTetrad(chromatics)
  }
  return false
}

// ===== メイン関数 =====

export function analyzeColors(colors: PCCSColor[]): AnalysisCard[] {
  const cards: AnalysisCard[] = []

  const hueRelCard = getHueRelationCard(colors)
  if (hueRelCard) cards.push(hueRelCard)

  const toneRelCard = getToneRelationCard(colors)
  if (toneRelCard) cards.push(toneRelCard)

  cards.push(...getHarmonyCards(colors))

  if (checkDominantColor(colors))
    cards.push({
      id: "tech-dominant-color",
      title: "ドミナントカラー",
      category: "配色技法",
      description: "全色が同一・隣接・類似色相（色相差0〜3）。共通の色相でまとめ、統一感を生む配色技法。"
    })
  if (checkDominantTone(colors))
    cards.push({
      id: "tech-dominant-tone",
      title: "ドミナントトーン",
      category: "配色技法",
      description:
        "全色が同一または類似トーン。共通のトーンで明度・彩度感をそろえ、まとまりを生む配色技法。"
    })
  if (checkToneOnTone(colors))
    cards.push({
      id: "tech-tone-on-tone",
      title: "トーンオントーン",
      category: "配色技法",
      description:
        "同一・類似色相で、同一列内の縦方向（明度差）にトーンを変化させた配色。明暗のグラデーション感が特徴。"
    })
  if (checkTonal(colors))
    cards.push({
      id: "tech-tonal",
      title: "トーナル",
      category: "配色技法",
      description:
        "全色が中間色トーン（ltg・g・sf・d）。落ち着いた中彩度の色でまとめた、穏やかでソフトな配色。"
    })
  if (checkCamaieu(colors))
    cards.push({
      id: "tech-camaieu",
      title: "カマイユ",
      category: "配色技法",
      description: "同一・隣接色相かつ隣接トーン。ほぼ同一に見える微妙な差をつけた、繊細な単色調の配色。"
    })
  if (checkFauxCamaieu(colors))
    cards.push({
      id: "tech-faux-camaieu",
      title: "フォカマイユ",
      category: "配色技法",
      description:
        "類似色相かつ同一・類似トーン。カマイユよりわずかに色相差を広げた、まとまりある繊細な配色。"
    })
  if (checkBicolor(colors))
    cards.push({
      id: "tech-bicolor",
      title: "ビコロール",
      category: "配色技法",
      description:
        "対照・補色色相の2色を高彩度（または無彩色）で組み合わせた配色。メリハリが強くインパクトのある印象。"
    })
  if (checkTricolor(colors))
    cards.push({
      id: "tech-tricolor",
      title: "トリコロール",
      category: "配色技法",
      description:
        "3色それぞれが互いに対照・補色の関係にある高彩度または無彩色の組み合わせ。力強いコントラストが特徴。"
    })

  if (checkDyad(colors))
    cards.push({
      id: "div-dyad",
      title: "ダイアード",
      category: "色相環の分割",
      description: "色相環を2分割した2色（色相差11〜12）。強い対比で互いを最大限に引き立てる配色。"
    })
  if (checkTriad(colors))
    cards.push({
      id: "div-triad",
      title: "トライアド",
      category: "色相環の分割",
      description: "色相環を3等分した3色（各色相差6〜10）。バランスよく鮮やかで活気ある配色。"
    })
  if (checkSplitComplementary(colors))
    cards.push({
      id: "div-split-comp",
      title: "スプリットコンプリメンタリー",
      category: "色相環の分割",
      description:
        "1色の補色を両隣に分割した3色構成。補色配色よりも穏やかなコントラストで、豊かな印象。"
    })
  if (checkTetrad(colors))
    cards.push({
      id: "div-tetrad",
      title: "テトラード",
      category: "色相環の分割",
      description: "色相環を4等分した4色（各色相差4〜8）。多彩で豊かな色の広がりを持つ配色。"
    })
  if (checkPentad(colors))
    cards.push({
      id: "div-pentad",
      title: "ペンタード",
      category: "色相環の分割",
      description:
        "色相環を5等分した5色（各色相差3〜7）。または有彩色3色（トライアド）＋白・黒の構成。"
    })
  if (checkHexad(colors))
    cards.push({
      id: "div-hexad",
      title: "ヘクサード",
      category: "色相環の分割",
      description:
        "色相環を6等分した6色（各色相差2〜6）。または有彩色4色（テトラード）＋白・黒の構成。"
    })

  return cards
}
