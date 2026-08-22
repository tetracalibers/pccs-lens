/**
 * 「数字は必ずインラインコードにする」のうち、**囲む範囲の判断が要るもの**を報告する。
 *
 * 単位辞書（lib/math-tokens.js の UNITS）で解決できない英字に隣接した数字が対象。
 * 固有名詞（`3D`・`3DCG`・`3DS`）・色記号（PCCS トーン `v2`・マンセル `5R`）・
 * BC 記法（`BC2万年`）で扱いが分かれるため、トークンの列挙で例外化せず判断待ちとして出す。
 *
 * 自動修正しない（syntax パスの `svx-number-in-code` は単位で解決できる分だけを直す）。
 */

import { maskForProseRules } from "../lib/svx.js"
import { unitAt } from "../lib/math-tokens.js"
import { forRule } from "../lib/rule-ids.js"

const NUMBER = /[0-9０-９]+(?:[.．][0-9０-９]+)*/g
const LATIN = /[A-Za-z]/

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "numbers-in-inline-code"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForProseRules(text, node)

      for (const matched of masked.matchAll(NUMBER)) {
        const digits = matched[0]
        const index = matched.index
        const before = text[index - 1] ?? ""
        const unit = unitAt(masked.slice(index + digits.length))
        const after = masked[index + digits.length] ?? ""
        if (!LATIN.test(before) && (unit !== null || !LATIN.test(after))) continue

        report(
          node,
          new RuleError(
            `数字「${digits}」が英字に隣接しています。単位・色記号・固有名詞のどこまでをインラインコードで囲むか確認してください。`,
            { index }
          )
        )
      }
    }
  }
}

export default { linter: forRule(RULE_ID, reporter) }
