/**
 * 「数学で定義されている関数名もインラインコードにする」（writing-guides/syntax-guide.md
 * 「数字は必ずインラインコードにする」節）を検査する。
 *
 * 地の文に裸の関数名（`sin`・`cos`・`log` など）が現れたら報告する。
 * 対象外にする領域は数字ルールと同じ（→ lib/svx.js の maskForProseRules）。
 *
 * 検出するのは「数学の関数として定義された名前」だけに絞る。`abs`・`min`・`max`・`mod`・
 * `floor` などプログラミング寄りの名前は、地の文の英単語と衝突しやすいため対象にしない。
 * 増やすときは FUNCTION_NAMES に追記する。
 */

import { maskForProseRules } from "../lib/svx.js"

/** 長いものから並べる（`sin` が `sinh` を食わないように） */
const FUNCTION_NAMES = [
  "arcsin",
  "arccos",
  "arctan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "log",
  "ln",
  "exp",
  "sqrt",
  "det",
  "lim"
]

const FUNCTION = new RegExp(`\\b(?:${FUNCTION_NAMES.join("|")})\\b`, "g")

/** 引数が続く形（`sin(x)`）は、どこまで囲むかが書き手の判断になる */
const OPENING_PAREN = /^[(（]/

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForProseRules(text, node)

      for (const matched of masked.matchAll(FUNCTION)) {
        const name = matched[0]
        const index = matched.index

        if (OPENING_PAREN.test(text.slice(index + name.length))) {
          report(
            node,
            new RuleError(
              `関数名「${name}」をインラインコードにしてください。引数が続くため、どこまでを囲むか確認してください。`,
              { index }
            )
          )
          continue
        }

        report(
          node,
          new RuleError(`関数名「${name}」をインラインコードにしてください（\`${name}\`）。`, {
            index,
            fix: fixer.replaceTextRange([index, index + name.length], `\`${name}\``)
          })
        )
      }
    }
  }
}

export default {
  linter: reporter,
  fixer: reporter
}
