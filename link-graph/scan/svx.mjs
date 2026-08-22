// 記事ページ（`+page.svx`）1 ファイルの解析。
//
// フロントマター（`title` / `draft`）・本文の状態（本文なし / draft / 公開済）・
// 本文中のルート相対リンクを取り出す。

import { parse as parseYaml } from "yaml"
import { EMPTY_BODY_SIGNATURE, EXCLUDED_DIRECTIVES } from "./config.mjs"

/** コードブロックの開始・終了。掲載コードの中のリンクは本文のリンクではないので除外する。 */
const CODE_FENCE = /^\s*(`{3,}|~{3,})(.*)$/

/** コンテナディレクティブの開始（`:::Note` / `::::CardGrid`）。 */
const DIRECTIVE_OPEN = /^(:{3,})([A-Za-z][A-Za-z0-9-]*)/

/** コンテナディレクティブの終了（開始と同じ数のコロンだけの行）。 */
const DIRECTIVE_CLOSE = /^(:{3,})[ \t]*$/

/**
 * ルート相対の Markdown リンク。`![alt](/path)` の画像は対象外。
 * 外部リンク（`https://`）・アンカーのみ（`#id`）は `/` 始まりでないので自然に外れる。
 */
const ROOT_RELATIVE_LINK = /(?<!!)\[([^[\]]*)\]\((\/[^()\s]*)\)/g

/**
 * フロントマターと本文を切り分ける。先頭が `---` で始まらないファイルはフロントマターなしとみなす。
 *
 * @param {string} source
 * @returns {{ frontmatter: string, body: string, bodyStartLine: number }}
 */
const splitFrontmatter = (source) => {
  const lines = source.split("\n")
  if (lines[0]?.trim() !== "---") return { frontmatter: "", body: source, bodyStartLine: 1 }

  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---")
  if (end === -1) return { frontmatter: "", body: source, bodyStartLine: 1 }

  return {
    frontmatter: lines.slice(1, end).join("\n"),
    body: lines.slice(end + 1).join("\n"),
    // 本文 1 行目のファイル内での行番号（1 始まり）。リンクの行番号をファイル基準で出すために持つ。
    bodyStartLine: end + 2
  }
}

/**
 * フロントマターから `title` と `draft` を取り出す。
 *
 * `title: ファーガソン曲線 # CG 3-4-3` のように行末コメントが付いているページがあるが、
 * YAML のコメントとして解釈されるので `#` 以降は自動的に落ちる。
 * YAML として解釈できない場合だけ、素朴な行パースにフォールバックする。
 *
 * @param {string} frontmatter
 * @returns {{ title: string | null, draft: boolean }}
 */
const readFrontmatter = (frontmatter) => {
  /** @type {Record<string, unknown> | null} */
  let data = null
  try {
    const parsed = parseYaml(frontmatter)
    if (parsed && typeof parsed === "object") data = /** @type {Record<string, unknown>} */ (parsed)
  } catch {
    data = null
  }

  if (data) {
    const title = typeof data.title === "string" ? data.title.trim() : null
    return { title: title || null, draft: data.draft === true }
  }

  const titleLine = frontmatter.match(/^title:(.*)$/m)
  const title = titleLine ? titleLine[1].replace(/\s+#.*$/, "").trim() : null
  return { title: title || null, draft: /^draft:\s*true\s*$/m.test(frontmatter) }
}

/**
 * 本文中のルート相対リンクを抽出する。
 *
 * コードブロックと、本文ではないディレクティブ（`:::Pending` / `:::Add` / `:::Fix` /
 * `:::Delete` / `:::Todo`）の中は、入れ子の深さを問わずすべて除外する。
 *
 * @param {string} body
 * @param {number} bodyStartLine 本文 1 行目のファイル内での行番号
 * @returns {{ href: string, text: string, line: number }[]}
 */
const extractLinks = (body, bodyStartLine) => {
  /** @type {{ href: string, text: string, line: number }[]} */
  const links = []

  /** @type {{ colons: number, name: string }[]} */
  const directives = []
  /** @type {{ marker: string, length: number } | null} */
  let fence = null

  const lines = body.split("\n")

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const fenceMatch = line.match(CODE_FENCE)

    if (fence) {
      // 終了フェンスは開始と同じ文字・同じ以上の長さで、後ろに何も付かない行。
      if (fenceMatch && fenceMatch[1][0] === fence.marker && fenceMatch[1].length >= fence.length) {
        if (fenceMatch[2].trim() === "") fence = null
      }
      continue
    }

    if (fenceMatch) {
      fence = { marker: fenceMatch[1][0], length: fenceMatch[1].length }
      continue
    }

    const close = line.match(DIRECTIVE_CLOSE)
    if (close) {
      // 同じコロン数で開いたものまで巻き戻す（`::::CardGrid` の中の `:::TermCard` に対応）。
      for (let depth = directives.length - 1; depth >= 0; depth--) {
        if (directives[depth].colons === close[1].length) {
          directives.length = depth
          break
        }
      }
      continue
    }

    const open = line.match(DIRECTIVE_OPEN)
    if (open) directives.push({ colons: open[1].length, name: open[2] })

    if (directives.some((directive) => EXCLUDED_DIRECTIVES.has(directive.name))) continue

    for (const match of line.matchAll(ROOT_RELATIVE_LINK)) {
      links.push({ text: match[1].trim(), href: match[2], line: bodyStartLine + index })
    }
  }

  return links
}

/**
 * `+page.svx` の内容を解析する。
 *
 * @param {string} source ファイルの内容
 * @returns {{ title: string | null, draft: boolean, emptyBody: boolean, links: { href: string, text: string, line: number }[] }}
 */
export const parseSvx = (source) => {
  const { frontmatter, body, bodyStartLine } = splitFrontmatter(source)
  const { title, draft } = readFrontmatter(frontmatter)

  // 「本文なし」は雛形（`## TODO` だけ）という機械的な線で判定する。
  // 見出しだけ立てて数行、`:::Todo` が残っている、といった中間状態は本文ありとして扱う。
  const emptyBody = body.replace(/\s+/g, "") === EMPTY_BODY_SIGNATURE

  return { title, draft, emptyBody, links: extractLinks(body, bodyStartLine) }
}
