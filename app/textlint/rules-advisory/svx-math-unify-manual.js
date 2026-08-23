/**
 * 昇格（インラインコード → インライン数式）のうち、**自動修正が踏み込めないもの**を報告する。
 *
 * ガイドの3つの統一ルール（ブロック数式の説明文・文単位・記事全体）に掛かっているが、
 * インライン数式へ組み直すのに判断が要るもの。たとえば `` `a = dy / dx` `` は、
 * 分数をどう組むか（`\dfrac` の分子・分母の取り方）を決めないとインライン数式にできない。
 *
 * 自動修正できないので syntax パスには置かない（「自動修正できない指摘は syntax パスに
 * 置かない」＝公開時ゲートからの自動実行を安全にするための組織原則）。
 */

import { analyze } from "../lib/math-scope.js"
import { forRule } from "../lib/rule-ids.js"

const TRIGGER_LABEL = {
  sentence: "インライン数式を含む文",
  block: "ブロック数式の記号を説明している文",
  article: "記事全体で数式側に揃っている記号"
}

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "math-promotion-style"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const { promotions } = analyze(getSource(), node)
      for (const promotion of promotions) {
        if (promotion.math !== null) continue
        report(
          node,
          new RuleError(
            `${TRIGGER_LABEL[promotion.trigger]}なので \`${promotion.content}\` はインライン数式にしますが、組み直しに判断が要ります（分数は \`\\dfrac\` で組む）。`,
            { index: promotion.start }
          )
        )
      }
    }
  }
}

export default { linter: forRule(RULE_ID, reporter) }
