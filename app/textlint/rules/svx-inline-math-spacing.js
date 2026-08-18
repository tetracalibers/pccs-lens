/**
 * 「インライン数式の前後には半角スペースを置く」（writing-guides/syntax-guide.md）を検査する。
 *
 * インライン数式は「1行の中に収まっている `$$...$$`」として検出する。
 * 段落全体が数式のブロック（`$$` と `$$` の間に改行が入るもの）は対象外。
 *
 * 例外:
 * - 約物（`、`・`。`・`・`・括弧など）に接する側はスペースを入れない
 * - 行頭・行末（前後に文字がない位置）
 * - コードブロック・インラインコード・HTML/Svelte・見出しの中
 */

import { isSpaceExemptChar, maskForMathRule } from "../lib/svx.js"

/** 1行に収まっているインライン数式 */
const INLINE_MATH = /\$\$([^\n$]+)\$\$/g

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForMathRule(text, node)

      for (const matched of masked.matchAll(INLINE_MATH)) {
        const start = matched.index
        const end = start + matched[0].length
        // 前後の文字は元のテキストから読む（マスク後の空白をスペースと誤認しないため）
        const before = start === 0 ? undefined : text[start - 1]
        const after = text[end]

        if (before !== " " && !isSpaceExemptChar(before)) {
          report(
            node,
            new RuleError("インライン数式の前に半角スペースを入れてください。", {
              index: start,
              fix: fixer.insertTextBeforeRange([start, end], " ")
            })
          )
        }

        if (after !== " " && !isSpaceExemptChar(after)) {
          report(
            node,
            new RuleError("インライン数式の後に半角スペースを入れてください。", {
              index: end,
              fix: fixer.insertTextAfterRange([start, end], " ")
            })
          )
        }
      }
    }
  }
}

export default {
  linter: reporter,
  fixer: reporter
}
