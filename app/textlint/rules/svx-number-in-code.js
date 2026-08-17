/**
 * 「数字は必ずインラインコードにする」（writing-guides/syntax-guide.md）を検査する。
 *
 * 地の文に裸の数字が現れたら報告する。単体の数字（`0と1`）だけでなく、
 * 単語中の数字（`2進数` → `` `2`進数 ``）も対象。
 *
 * 対象外（→ lib/svx.js の maskForNumberRule）:
 * - コードブロック・インラインコード・フロントマター・HTML/Svelte
 * - 見出し（`### 2次元直交座標系` や `:WithGroupTag[2次元的な...]` のラベル）
 * - ディレクティブ名・ラベル・属性（`::Heading2`・`:Anki[10YR]`・`{grades="2,uc"}`）
 * - 数式 `$$...$$`・リンクの URL
 *
 * 英字に隣接する数字（`600nm`・`3DCG`・`v5`・`199a`）は、単位・記号・固有名詞で
 * 扱いが分かれるため、報告はするが自動修正はしない。
 */

import { maskForNumberRule } from "../lib/svx.js"

const DIGITS = /[0-9０-９]+/g
const LATIN = /[A-Za-z]/

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      const text = getSource()
      const masked = maskForNumberRule(text, node)

      for (const matched of masked.matchAll(DIGITS)) {
        const digits = matched[0]
        const index = matched.index
        const before = text[index - 1] ?? ""
        const after = text[index + digits.length] ?? ""
        const nextToLatin = LATIN.test(before) || LATIN.test(after)

        if (nextToLatin) {
          report(
            node,
            new RuleError(
              `数字「${digits}」をインラインコードにしてください。英字に隣接しているため、単位・記号・固有名詞のどこまでを囲むか確認してください。`,
              { index }
            )
          )
          continue
        }

        report(
          node,
          new RuleError(`数字「${digits}」をインラインコードにしてください（\`${digits}\`）。`, {
            index,
            fix: fixer.replaceTextRange([index, index + digits.length], `\`${digits}\``)
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
