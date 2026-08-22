/**
 * 「プライム記号はアポストロフィ `'` ではなく `^{\prime}` で書く」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * mdsvex の smartypants がレンダリング前に `'` をカーリークォート `’`（U+2019）へ変換し、
 * KaTeX が unknownSymbol の警告を出すため、数式の中でアポストロフィを使えない。
 * インライン数式・ブロック数式の両方を対象にする。
 */

import { maskForMathRule } from "../lib/svx.js"
import { forRule } from "../lib/rule-ids.js"

/** 数式（インライン・ブロックとも） */
const MATH = /\$\$[\s\S]*?\$\$/g
/** 記号に続くアポストロフィ（`x'`・`P_1'`・`)'`） */
const PRIME = /(?<=[A-Za-z0-9})\]])'/g

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "prime-notation"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const masked = maskForMathRule(getSource(), node)

      for (const math of masked.matchAll(MATH)) {
        for (const prime of math[0].matchAll(PRIME)) {
          const index = math.index + prime.index
          report(
            node,
            new RuleError("数式のプライム記号は `^{\\prime}` と書いてください。", {
              index,
              fix: fixer.replaceTextRange([index, index + 1], "^{\\prime}")
            })
          )
        }
      }
    }
  }
}

const rule = forRule(RULE_ID, reporter)

export default {
  linter: rule,
  fixer: rule
}
