/**
 * 中黒で繋いだインライン数式の並びのうち、**記号の並列か語句の並列かの判断が要るもの**を報告する。
 *
 * `$$P_0$$・$$P_1$$`（記号の並列）はまとめてカンマで区切るが、
 * `$$x$$ 方向に $$a$$・$$y$$ 方向に $$b$$ 進む`（語句の並列）は中黒のままにする
 * （→ writing-guides/math-notation-guide.md「記号を並べるときは1つのインライン数式にまとめ、
 * カンマで区切る」）。並びの直後に自立語が続く場合はこの2つを字面で分けられないため、
 * 自動修正せずここで判断待ちとして出す。
 *
 * 直後が助詞・約物・行末のものは syntax パスの `svx-math-enum-comma` が自動修正する。
 */

import { maskForMathRule } from "../lib/svx.js"
import { collectMathEnumerations } from "../lib/math-enum.js"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForMathRule(text, node)

      for (const enumeration of collectMathEnumerations(text, masked)) {
        if (enumeration.fixable) continue
        report(
          node,
          new RuleError(
            `\`${enumeration.source}\` は、記号の並列なら \`${enumeration.fixed}\` にまとめますが、語句の並列（\`$$x$$ 方向に $$a$$・$$y$$ 方向に $$b$$\`）なら中黒のままにします。`,
            { index: enumeration.start }
          )
        )
      }
    }
  }
}

export default { linter: reporter }
