/**
 * 「スコープを見て初めて決まる」記法ルールのための解析。
 *
 * `writing-guides/math-notation-guide.md` の次の4つは、1つのトークンだけを見ても判定できない。
 *
 * | ガイドの節 | 何を見るか |
 * | --- | --- |
 * | ブロック数式を説明する文では、その式の記号をインライン数式で書く | ブロック数式の記号 |
 * | インライン数式を含む文では、数式・変数・関数名をインライン数式に統一する | 文の中の他のトークン |
 * | 同じ対象を表す記号は…混在させない | 記事全体の記号の書き方 |
 * | インライン数式はなるべく使わず、インラインコードで書く | 上の3つに拾われなかった残り |
 *
 * **適用順序が意味を持つ。** 「なるべくインラインコード」を素朴に判定すると、KaTeX 必須記号を
 * 含まない `$$…$$` はすべて降格候補になり、実測で全記事857件中478件が挙がる。そのうち大半は
 * ブロック数式の記号を説明している `$$t$$`・`$$C(t)$$` で、維持が正しい。上の3つを先に確定させ、
 * **降格候補はその残差として**求めることでこれを避ける。
 *
 * この解析は「昇格（インラインコード → インライン数式）」だけを自動修正の対象にする。
 * 降格は「3つに拾われなかったこと」を根拠にするため、スコープ検出の取りこぼしがそのまま
 * 誤修正になる。降格は advisory パスで報告するだけにとどめる。
 */

import {
  PROSE_PATTERNS,
  STRUCTURAL_NODE_TYPES,
  blankOut,
  collectRanges,
  maskNodes,
  maskPattern
} from "./svx.js"
import { baseSymbols, classifyCode, requiresKatex, toUnicode } from "./math-tokens.js"
import { forRule } from "./rule-ids.js"

/** ブロック数式（段落全体が `$$…$$` のもの） */
const BLOCK_MATH = /^\$\$[ \t]*\n[\s\S]*?^\$\$[ \t]*$/gm

/** 1行に収まっているインライン数式 */
const INLINE_MATH = /\$\$([^\n$]+)\$\$/g

/** `:::Action`（`{fixme}` 付きも同じ）の開始行と、ディレクティブの終了行 */
const ACTION_OPEN = /^(:{3,})Action(?:\{[^}]*\})?[ \t]*$/
const DIRECTIVE_CLOSE = /^(:{3,})[ \t]*$/

/** 文の区切り。マスクされた領域（空白）は区切りにならない */
const SENTENCE_BREAK = /[。！？\n]/

/** 解析結果のキャッシュ。textlint は同じテキストに対して複数のルールを回す */
const cache = new Map()
const CACHE_LIMIT = 8

/**
 * 記事本文を解析して、昇格・降格の候補とスコープ情報を返す。
 * @param {string} text
 * @param {object} documentNode
 */
export const analyze = (text, documentNode) => {
  const cached = cache.get(text)
  if (cached) return cached
  const result = build(text, documentNode)
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value)
  cache.set(text, result)
  return result
}

/** 範囲の配列に位置が含まれるか */
const within = (ranges, index) => ranges.some(([start, end]) => index >= start && index < end)

/** `:::Action` のブロックの範囲（開始行の先頭から終了行の末尾まで） */
const findActionRegions = (text) => {
  const regions = []
  const lines = text.split("\n")
  let offset = 0
  let open = null
  for (const line of lines) {
    const opening = ACTION_OPEN.exec(line)
    if (open === null && opening) {
      open = { start: offset, colons: opening[1].length }
    } else if (open !== null) {
      const closing = DIRECTIVE_CLOSE.exec(line)
      if (closing && closing[1].length === open.colons) {
        regions.push([open.start, offset + line.length])
        open = null
      }
    }
    offset += line.length + 1
  }
  return regions
}

const build = (text, documentNode) => {
  // 1. 構造的に対象外の領域（フロントマター・コードブロック・HTML/Svelte・見出し）を潰す。
  //    インラインコードとインライン数式は位置を知りたいので残す。
  let structural = maskNodes(text, documentNode, STRUCTURAL_NODE_TYPES)
  for (const pattern of [PROSE_PATTERNS.TAG, PROSE_PATTERNS.ORDERED_LIST_MARKER])
    structural = maskPattern(structural, pattern)

  const headers = collectRanges(documentNode, ["Header"])
  const links = collectRanges(documentNode, ["Link"])
  const codeNodes = collectRanges(documentNode, ["Code"], STRUCTURAL_NODE_TYPES).filter(
    ([start]) => !within(headers, start) && !within(links, start)
  )

  // 2. ブロック数式・`:::Action`・リンク・ディレクティブを潰したものが「地の文」になる。
  const blockMathRanges = [...structural.matchAll(BLOCK_MATH)].map((matched) => [
    matched.index,
    matched.index + matched[0].length
  ])
  const actionRegions = findActionRegions(text)

  let prose = structural
  for (const [start, end] of [...blockMathRanges, ...actionRegions, ...links])
    prose = blankOut(prose, start, end)
  for (const pattern of [
    PROSE_PATTERNS.DIRECTIVE,
    PROSE_PATTERNS.LINK_DESTINATION,
    PROSE_PATTERNS.BARE_URL
  ])
    prose = maskPattern(prose, pattern)

  // 3. 地の文に残ったインライン数式とインラインコードを拾う。
  const mathSpans = [...prose.matchAll(INLINE_MATH)].map((matched) => ({
    start: matched.index,
    end: matched.index + matched[0].length,
    body: matched[1],
    symbols: baseSymbols(matched[1]),
    katex: requiresKatex(matched[1])
  }))
  const codeSpans = codeNodes
    .filter(([start]) => prose[start] !== " " && !within(actionRegions, start))
    .map(([start, end]) => {
      const content = text.slice(start, end).replace(/^`+|`+$/g, "")
      return { start, end, content, ...classifyCode(content) }
    })

  // 4. 文に切る。数式・コードの中身は潰してから区切りを探す（`。` を含む式で切らないため）
  let sentenceText = prose
  for (const span of [...mathSpans, ...codeSpans])
    sentenceText = blankOut(sentenceText, span.start, span.end)
  const sentences = splitSentences(sentenceText)
  const sentenceOf = (index) => sentences.findIndex(([start, end]) => index >= start && index < end)

  for (const span of mathSpans) span.sentence = sentenceOf(span.start)
  for (const span of codeSpans) span.sentence = sentenceOf(span.start)

  // 5. 記号のインベントリ。ブロック数式は節単位（見出しで区切る）と記事全体の両方で持つ。
  const sectionBounds = sectionsOf(text, headers)
  const sectionOf = (index) =>
    sectionBounds.findIndex(([start, end]) => index >= start && index < end)
  const sectionBlockSymbols = sectionBounds.map(() => new Set())
  const articleBlockSymbols = new Set()
  for (const [start, end] of blockMathRanges) {
    const symbols = baseSymbols(text.slice(start, end))
    const section = sectionOf(start)
    for (const symbol of symbols) {
      articleBlockSymbols.add(symbol)
      if (section >= 0) sectionBlockSymbols[section].add(symbol)
    }
  }

  // 6. インライン数式のうち「そこにある理由が説明できるもの」を確定させる。
  //    残りが降格候補（「なるべくインラインコード」）になる。
  markLegitimate(mathSpans, articleBlockSymbols)

  /** 記事の中で「数式として書かれている」と言える記号 */
  const mathSymbols = new Set(articleBlockSymbols)
  for (const span of mathSpans)
    if (span.katex) for (const symbol of span.symbols) mathSymbols.add(symbol)

  const sentenceHasMath = new Set(mathSpans.map((span) => span.sentence))

  // 7. 昇格候補。文単位（②）→ ブロック数式の説明文（①）→ 記事全体（③）の順に確定させる。
  const promotions = []
  for (const span of codeSpans) {
    if (span.kind === "number" || span.kind === "other") continue
    const trigger = triggerOf(span, {
      sentenceHasMath,
      sectionBlockSymbols: sectionBlockSymbols[sectionOf(span.start)] ?? new Set(),
      mathSymbols
    })
    if (trigger === null) continue
    promotions.push({ ...span, trigger })
  }

  const demotions = mathSpans.filter((span) => !span.legitimate)

  // 8. `:::Action` の中のインライン数式。Unicode で書ける記号はインラインコードへ、
  //    書けない式は日本語への言い換えが要る（→ advisory パス）
  const actionMath = []
  for (const [start, end] of actionRegions)
    for (const matched of structural.slice(start, end).matchAll(INLINE_MATH))
      actionMath.push({
        start: start + matched.index,
        end: start + matched.index + matched[0].length,
        body: matched[1],
        unicode: toUnicode(matched[1])
      })

  return {
    actionMath,
    actionRegions,
    blockMathRanges,
    codeSpans,
    demotions,
    mathSpans,
    promotions,
    prose,
    sentences
  }
}

/** 昇格の根拠を、スコープの狭い順に確定させる */
const triggerOf = (span, { sentenceHasMath, sectionBlockSymbols, mathSymbols }) => {
  if (span.sentence >= 0 && sentenceHasMath.has(span.sentence)) return "sentence"
  if (span.symbols.some((symbol) => sectionBlockSymbols.has(symbol))) return "block"
  if (span.symbols.some((symbol) => mathSymbols.has(symbol))) return "article"
  return null
}

/**
 * インライン数式が「維持して正しい」ものかを決める。
 *
 * 1. KaTeX でしか書けない記号を含む
 * 2. その記号がブロック数式に出てくる（ブロック数式の説明文・記事全体の統一）
 * 3. 同じ文に 1 を満たすインライン数式がある（文単位の統一）
 * 4. 同じ記号が 1・2 を満たすインライン数式にも出てくる（記事全体の統一）
 */
const markLegitimate = (mathSpans, articleBlockSymbols) => {
  for (const span of mathSpans)
    span.seed = span.katex || [...span.symbols].some((symbol) => articleBlockSymbols.has(symbol))

  const seededSentences = new Set(
    mathSpans.filter((span) => span.seed).map((span) => span.sentence)
  )
  const seededSymbols = new Set()
  for (const span of mathSpans)
    if (span.seed) for (const symbol of span.symbols) seededSymbols.add(symbol)

  for (const span of mathSpans)
    span.legitimate =
      span.seed ||
      (span.sentence >= 0 && seededSentences.has(span.sentence)) ||
      [...span.symbols].some((symbol) => seededSymbols.has(symbol))
}

/** 文の範囲に切る。中身が空白だけの範囲は捨てる */
const splitSentences = (text) => {
  const sentences = []
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    if (!SENTENCE_BREAK.test(text[index])) continue
    if (index + 1 > start) sentences.push([start, index + 1])
    start = index + 1
  }
  if (start < text.length) sentences.push([start, text.length])
  return sentences
}

/** 見出しで区切った節の範囲。見出しが1つも無ければ記事全体を1節とする */
const sectionsOf = (text, headers) => {
  if (headers.length === 0) return [[0, text.length]]
  const bounds = []
  const starts = headers.map(([start]) => start)
  if (starts[0] > 0) bounds.push([0, starts[0]])
  for (const [index, start] of starts.entries())
    bounds.push([start, starts[index + 1] ?? text.length])
  return bounds
}

/**
 * 昇格ルール（①②③）の共通の骨組み。
 *
 * 昇格の根拠（trigger）ごとにルールを分けているのは、指摘のメッセージがガイドのどの節に
 * 対応するかを示せるようにするため。**1つのトークンには1つの根拠しか付かない**ように
 * analyze() 側で狭いスコープから順に確定させているので、複数のルールが同じ箇所を
 * 二重に報告することはない。
 *
 * @param {string} ruleId ガイドのルールID（→ writing-guides/math-notation-guide.md）
 * @param {string} trigger `"sentence"` | `"block"` | `"article"`
 * @param {(promotion: object) => string} describe 指摘のメッセージ
 */
export const promotionRule = (ruleId, trigger, describe) => {
  const reporter = (context) => {
    const { Syntax, RuleError, report, getSource, fixer } = context
    return {
      [Syntax.Document](node) {
        const { promotions } = analyze(getSource(), node)
        for (const promotion of promotions) {
          // math が null のものは組み直す判断が要る（→ advisory パスの svx-math-unify-manual）
          if (promotion.trigger !== trigger || promotion.math === null) continue
          report(
            node,
            new RuleError(describe(promotion), {
              index: promotion.start,
              fix: fixer.replaceTextRange([promotion.start, promotion.end], `$$${promotion.math}$$`)
            })
          )
        }
      }
    }
  }
  const rule = forRule(ruleId, reporter)
  return { linter: rule, fixer: rule }
}
