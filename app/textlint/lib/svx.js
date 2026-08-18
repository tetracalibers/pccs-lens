/**
 * 記事本文（`.svx`）を textlint で検査するための共通ヘルパ。
 *
 * mdsvex のディレクティブ（`:Anki[...]` など）と KaTeX の数式（`$$...$$`）は、
 * textlint の Markdown パーサからは「ただのテキスト」として見えるため、
 * 記法ルールの対象外にする領域は自前で潰す（マスクする）必要がある。
 *
 * マスクは「同じ長さの空白に置き換える」方式で行う。文字位置が元のテキストと
 * 一致するので、検出位置（行・桁）とオートフィックスの範囲がそのまま使える。
 */

/** マスク対象のノード型（フロントマター・コードブロック・インラインコード・HTML/Svelte・見出し） */
export const MASKED_NODE_TYPES = ["Yaml", "CodeBlock", "Code", "Html", "Header"]

/** 数式（インライン・ブロックとも）。数字ルール・コードルールの対象外 */
const MATH = /\$\$[\s\S]*?\$\$/g

/** ディレクティブ（`:::Name{attr}`・`:Anki[ラベル]`・`::EImage{src="{変数}"}` など） */
const DIRECTIVE = /:{1,4}[A-Za-z][A-Za-z0-9]*(?:\[[^\]\n]*\])?(?:\{(?:[^{}]|\{[^{}]*\})*\})?/g

/** リンクの URL 部分（`](/color-theory/...)`）と生の URL */
const LINK_DESTINATION = /\]\([^)\n]*\)/g
const BARE_URL = /https?:\/\/[^\s)]+/g

/**
 * Svelte コンポーネントの使用箇所（`<AnalyzedPalette pccs={["v2", "dp4"]} />` など）。
 * 属性値にマスタッシュやクォートを含むタグは CommonMark の HTML ブロックとして
 * 認識されず、段落のテキストとして AST に現れるため、正規表現でも潰す。
 */
const TAG = /<\/?[A-Za-z][A-Za-z0-9]*[^<>]*>/g

/** 順序付きリストのマーカー（段落の途中に現れてリストと解釈されなかったものも含む） */
const ORDERED_LIST_MARKER = /^[ \t]*\d+\.[ \t]/gm

/** 約物。数式の前後にスペースを入れない例外（→ math-notation-guide.md） */
const PUNCTUATION = /[、。，．・：；！？「」『』（）〔〕［］｛｝〈〉《》【】〜～…‥,.;:!?()[\]{}'"]/

/**
 * `start` から `end` までを、改行を保ったまま空白に置き換える。
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
const blankOut = (text, start, end) => {
  const masked = text.slice(start, end).replace(/[^\n]/g, " ")
  return text.slice(0, start) + masked + text.slice(end)
}

/**
 * AST を辿って、指定した型のノードが占める範囲をマスクする。
 * @param {string} text 元のテキスト
 * @param {object} documentNode Document ノード
 * @param {string[]} types マスクする型
 * @returns {string}
 */
const maskNodes = (text, documentNode, types) => {
  const targets = new Set(types)
  const ranges = []
  const walk = (node) => {
    if (targets.has(node.type)) {
      ranges.push(node.range)
      return
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk(documentNode)
  return ranges.reduce((acc, [start, end]) => blankOut(acc, start, end), text)
}

/**
 * 正規表現に一致する部分をマスクする。
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {string}
 */
const maskPattern = (text, pattern) =>
  text.replace(pattern, (matched) => matched.replace(/[^\n]/g, " "))

/**
 * 地の文だけを残したテキストを返す（数字ルール・関数名ルールが使う）。
 *
 * 対象外にするもの:
 * - フロントマター・コードブロック・インラインコード・HTML/Svelte（AST から）
 * - 見出し（`## :WithGroupTag[2次元的な...]` や `### 2次元直交座標系`）
 * - 数式 `$$...$$`
 * - ディレクティブ名・ラベル・属性（`:Anki[10YR]`・`{grades="2,uc"}`・`::Heading2`）
 * - リンクの URL・Svelte コンポーネントの使用箇所・順序付きリストのマーカー
 *
 * @param {string} text
 * @param {object} documentNode
 * @returns {string}
 */
export const maskForProseRules = (text, documentNode) => {
  let masked = maskNodes(text, documentNode, MASKED_NODE_TYPES)
  masked = maskPattern(masked, TAG)
  masked = maskPattern(masked, MATH)
  masked = maskPattern(masked, DIRECTIVE)
  masked = maskPattern(masked, LINK_DESTINATION)
  masked = maskPattern(masked, BARE_URL)
  masked = maskPattern(masked, ORDERED_LIST_MARKER)
  return masked
}

/**
 * 数式ルールの検査対象だけを残したテキストを返す。
 * 数式そのものは残し、コード・HTML・見出しを対象外にする。
 * @param {string} text
 * @param {object} documentNode
 * @returns {string}
 */
export const maskForMathRule = (text, documentNode) =>
  maskNodes(text, documentNode, MASKED_NODE_TYPES)

/**
 * 数式の前後でスペースを省略してよい文字か（約物・改行・行頭行末）。
 * @param {string | undefined} char
 * @returns {boolean}
 */
export const isSpaceExemptChar = (char) =>
  char === undefined || char === "\n" || PUNCTUATION.test(char)

/** 半角スペースまたは全角スペースか */
export const isSpace = (char) => char === " " || char === "　"
