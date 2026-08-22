/**
 * 「数学で定義されている関数名もインラインコードにする」のうち、**引数が続く形**を報告する。
 *
 * `sin(x)` のように引数が続くと、関数名だけを囲むか引数まで含めるかが書き手の判断になる。
 * 自動修正しない（syntax パスの `svx-math-function-in-code` は裸の関数名だけを直す）。
 */

import { maskForProseRules } from "../lib/svx.js"
import { FUNCTION_NAMES } from "../lib/math-tokens.js"
import { forRule } from "../lib/rule-ids.js"

const FUNCTION = new RegExp(`\\b(?:${FUNCTION_NAMES.join("|")})\\b`, "g")
const OPENING_PAREN = /^[(（]/

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "function-names-in-inline-code"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForProseRules(text, node)

      for (const matched of masked.matchAll(FUNCTION)) {
        const name = matched[0]
        const index = matched.index
        if (!OPENING_PAREN.test(text.slice(index + name.length))) continue
        report(
          node,
          new RuleError(
            `関数名「${name}」に引数が続いています。どこまでをインラインコードで囲むか確認してください。`,
            { index }
          )
        )
      }
    }
  }
}

export default { linter: forRule(RULE_ID, reporter) }
