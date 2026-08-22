/**
 * 「`:::Action` のテキストではインライン数式を使わない」のうち、
 * **日本語への言い換えが必要なもの**を報告する。
 *
 * 添字・分数・行列は Unicode の文字だけでは書けないので、`:::Action` に持ち込まず日本語で
 * 言い換える（`$$f_s$$` を上げる操作なら「標本化周波数を上げてみよう」）。
 * 文章を書く判断なので自動修正しない（Unicode で書ける記号は syntax パスの
 * `svx-action-no-inline-math` が直す）。
 */

import { analyze } from "../lib/math-scope.js"
import { forRule } from "../lib/rule-ids.js"

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "action-no-inline-math"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const { actionMath } = analyze(getSource(), node)
      for (const math of actionMath) {
        if (math.unicode !== null) continue
        report(
          node,
          new RuleError(
            `\`:::Action\` の $$${math.body}$$ は Unicode の文字だけでは書けません。日本語に言い換えてください。`,
            { index: math.start }
          )
        )
      }
    }
  }
}

export default { linter: forRule(RULE_ID, reporter) }
