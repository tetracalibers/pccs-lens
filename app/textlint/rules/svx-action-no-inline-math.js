/**
 * 「`:::Action` のテキストではインライン数式を使わない」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * ギリシャ文字も含めて、Unicode の文字で書ける記号はインラインコードに入れる
 * （`$$\theta$$` → `` `θ` ``）。この置き換えは決定的なので自動修正する。
 *
 * 添字・分数・行列のように Unicode の文字だけでは書けない式は、`:::Action` に持ち込まず
 * 日本語で言い換える。これは文章を書く判断なので、advisory パスの
 * `svx-action-math-rewrite` が報告するだけにとどめる。
 */

import { analyze } from "../lib/math-scope.js"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const { actionMath } = analyze(getSource(), node)

      for (const math of actionMath) {
        if (math.unicode === null) continue
        report(
          node,
          new RuleError(
            `\`:::Action\` のテキストではインライン数式を使いません（\`${math.unicode}\` のようにインラインコードで書く）。`,
            {
              index: math.start,
              fix: fixer.replaceTextRange([math.start, math.end], `\`${math.unicode}\``)
            }
          )
        )
      }
    }
  }
}

export default {
  linter: reporter,
  fixer: reporter
}
