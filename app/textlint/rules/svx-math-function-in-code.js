/**
 * 「数学で定義されている関数名もインラインコードにする」（writing-guides/math-notation-guide.md
 * 「数字は必ずインラインコードにする」節）を検査する。
 *
 * 地の文に裸の関数名（`sin`・`cos`・`log` など）が現れたら報告する。
 * 対象外にする領域は数字ルールと同じ（→ lib/svx.js の maskForProseRules）。
 *
 * 検出するのは「数学の関数として定義された名前」だけに絞る。`abs`・`min`・`max`・`mod`・
 * `floor` などプログラミング寄りの名前は、地の文の英単語と衝突しやすいため対象にしない。
 * 増やすときは lib/math-tokens.js の FUNCTION_NAMES に追記する。
 *
 * 引数が続く形（`sin(x)`）は、どこまでを囲むかが書き手の判断になるのでここでは報告しない。
 * advisory パスの `svx-code-range-function` が判断待ちとして出す。
 */

import { maskForProseRules } from "../lib/svx.js"
import { FUNCTION_NAMES } from "../lib/math-tokens.js"

const FUNCTION = new RegExp(`\\b(?:${FUNCTION_NAMES.join("|")})\\b`, "g")

/** 引数が続く形（`sin(x)`）。囲む範囲の判断が要るので advisory パスに回す */
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

        // 引数が続く形は advisory パスの領分
        if (OPENING_PAREN.test(text.slice(index + name.length))) continue

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
