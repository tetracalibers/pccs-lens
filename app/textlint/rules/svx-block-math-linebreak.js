/**
 * 「ブロック数式の改行」（writing-guides/math-notation-guide.md）を検査する。
 *
 * - 改行は `\\\\`（バックスラッシュ4つ）で書く。mdsvex のエスケープを通すため2つでは足りない。
 * - `\frac` を含むブロックは、行末の改行を `\\\\\\\\`（8つ）にして行間を確保する。
 *
 * **8つになっているものを4つへ戻すことはしない。** 行列のように背の高い式で行間を空けている
 * ブロック（`\frac` を含まないが8つで書かれているもの）が実際にあり、ガイドも8つを禁じていない。
 * 直すのは「足りない側」だけにする。
 *
 * 行の途中にある `\\\\`（`\begin{pmatrix} x \\\\ y \end{pmatrix}` の行区切り）は、
 * 行間の調整とは無関係なので4つのままにする。8つにするのは**行末**だけ。
 */

import { maskForMathRule } from "../lib/svx.js"

/** ブロック数式（段落全体が `$$...$$` のもの） */
const BLOCK_MATH = /^\$\$[ \t]*\n[\s\S]*?^\$\$[ \t]*$/gm
/** ちょうど2つのバックスラッシュ */
const TWO = /(?<!\\)\\{2}(?!\\)/g
/** 行末にあるちょうど4つのバックスラッシュ */
const FOUR_AT_LINE_END = /(?<!\\)\\{4}(?!\\)[ \t]*(?=\n)/g

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const masked = maskForMathRule(getSource(), node)

      for (const block of masked.matchAll(BLOCK_MATH)) {
        const body = block[0]

        for (const matched of body.matchAll(TWO)) {
          const index = block.index + matched.index
          report(
            node,
            new RuleError(
              "ブロック数式の改行は `\\\\\\\\`（バックスラッシュ4つ）で書いてください。",
              {
                index,
                fix: fixer.replaceTextRange([index, index + 2], "\\\\\\\\")
              }
            )
          )
        }

        if (!/\\frac\b/.test(body)) continue
        for (const matched of body.matchAll(FOUR_AT_LINE_END)) {
          const index = block.index + matched.index
          report(
            node,
            new RuleError(
              "`\\frac` を含むブロック数式の行末は `\\\\\\\\\\\\\\\\`（バックスラッシュ8つ）で改行してください。",
              {
                index,
                fix: fixer.replaceTextRange([index, index + 4], "\\\\\\\\\\\\\\\\")
              }
            )
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
