/**
 * 「数字は必ずインラインコードにする」（writing-guides/math-notation-guide.md）を検査する。
 *
 * 地の文に裸の数字が現れたら報告する。単体の数字（`0と1`）だけでなく、
 * 単語中の数字（`2進数` → `` `2`進数 ``）も対象。小数（`2.5`）は1つの数値として扱う
 * （`2.5YR` を `` `2`.5YR `` に割らないため）。
 *
 * 単位つきの数値は、ガイドの「単位も含めてインラインコードにします」のとおり、
 * 単位辞書（lib/math-tokens.js の UNITS）に載っている単位ごと囲む（`600nm` → `` `600nm` ``）。
 *
 * 対象外（→ lib/svx.js の maskForProseRules）:
 * - コードブロック・インラインコード・フロントマター・HTML/Svelte
 * - 見出し（`### 2次元直交座標系` や `:WithGroupTag[2次元的な...]` のラベル）
 * - ディレクティブ名・ラベル・属性（`::Heading2`・`:Anki[10YR]`・`{grades="2,uc"}`）
 * - 数式 `$$...$$`・リンクの URL
 *
 * 単位辞書に載っていない英字に隣接する数字（`3DCG`・`v5`・`BC2万年`）は、囲む範囲の判断が
 * 要るのでここでは報告しない。advisory パスの `svx-code-range-number` が判断待ちとして出す。
 */

import { maskForProseRules } from "../lib/svx.js"
import { unitAt } from "../lib/math-tokens.js"
import { forRule } from "../lib/rule-ids.js"

/** 数値（整数・小数） */
const NUMBER = /[0-9０-９]+(?:[.．][0-9０-９]+)*/g
const LATIN = /[A-Za-z]/

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "numbers-in-inline-code"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForProseRules(text, node)

      for (const matched of masked.matchAll(NUMBER)) {
        const digits = matched[0]
        const index = matched.index
        const before = text[index - 1] ?? ""
        const unit = unitAt(masked.slice(index + digits.length))
        const token = unit === null ? digits : `${digits}${unit}`
        const after = masked[index + token.length] ?? ""

        // 単位辞書で解決できない英字との隣接は advisory パスの領分
        if (LATIN.test(before) || (unit === null && LATIN.test(after))) continue

        report(
          node,
          new RuleError(`数字「${token}」をインラインコードにしてください（\`${token}\`）。`, {
            index,
            fix: fixer.replaceTextRange([index, index + token.length], `\`${token}\``)
          })
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
