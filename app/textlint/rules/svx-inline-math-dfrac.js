/**
 * 「インライン数式の分数は `\dfrac` で書く」（writing-guides/math-notation-guide.md）を検査する。
 *
 * インライン数式（1行に収まっている `$$...$$`）の中の `\frac` を `\dfrac` に直す。
 * ブロック数式（段落全体が `$$...$$` のもの）はもとからディスプレイサイズで組まれるため対象外。
 *
 * スラッシュで書かれた分数（`$$y/b$$`）は、どこを分子・分母に取るかの判断が要るので
 * ここでは報告しない（advisory パスの `svx-math-unify-manual` が昇格時の判断として出す）。
 */

import { maskForMathRule } from "../lib/svx.js"
import { forRule } from "../lib/rule-ids.js"

/** 1行に収まっているインライン数式 */
const INLINE_MATH = /\$\$([^\n$]+)\$\$/g

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "inline-math-dfrac"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const masked = maskForMathRule(getSource(), node)

      for (const matched of masked.matchAll(INLINE_MATH)) {
        const body = matched[1]
        if (!/\\frac\b/.test(body)) continue
        const start = matched.index
        const end = start + matched[0].length
        report(
          node,
          new RuleError("インライン数式の分数は `\\dfrac` で組んでください。", {
            index: start,
            fix: fixer.replaceTextRange([start, end], `$$${body.replace(/\\frac\b/g, "\\dfrac")}$$`)
          })
        )
      }
    }
  }
}

const rule = forRule(RULE_ID, reporter)

export default {
  linter: rule,
  fixer: rule
}
