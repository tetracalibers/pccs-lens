/**
 * 「記号を並べるときは1つのインライン数式にまとめ、カンマで区切る」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * `$$P_0$$・$$P_1$$` のように中黒で繋いだインライン数式の並びを、`$$P_0, P_1$$` にまとめる。
 *
 * **語句の並列（`$$x$$ 方向に $$a$$・$$y$$ 方向に $$b$$ 進む`）はガイドの例外**で、まとめてはいけない。
 * 並びの直後に助詞・約物・行末が続くものだけを自動修正の対象にして、自立語が続くものは
 * advisory パスの `svx-math-enum-comma-manual` へ回す（判定は `lib/math-enum.js`）。
 */

import { maskForMathRule } from "../lib/svx.js"
import { collectMathEnumerations } from "../lib/math-enum.js"
import { forRule } from "../lib/rule-ids.js"

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "math-enum-comma"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForMathRule(text, node)

      for (const enumeration of collectMathEnumerations(text, masked)) {
        if (!enumeration.fixable) continue
        report(
          node,
          new RuleError(
            `記号を並べるときは中黒で繋がず、1つのインライン数式にまとめてカンマで区切ってください（\`${enumeration.fixed}\`）。`,
            {
              index: enumeration.start,
              fix: fixer.replaceTextRange([enumeration.start, enumeration.end], enumeration.fixed)
            }
          )
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
