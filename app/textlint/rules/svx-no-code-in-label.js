/**
 * 「`:Anki[]`・`:Mark[]` のラベルと、リンクのテキストの中ではインラインコードを使わない」
 * （writing-guides/math-notation-guide.md「数字は必ずインラインコードにする」節）を検査する。
 *
 * ディレクティブのラベルはインラインコードとして解釈されないのでそもそも囲めず、
 * リンクのラベルは装飾を混ぜずひとまとまりで見せるため囲まない。
 * どちらもバッククォートを外すだけで直る。
 */

import { maskNodes } from "../lib/svx.js"

/** バッククォートを含む `:Anki[…]`・`:Mark[…]` のラベル */
const LABEL = /:(?:Anki|Mark)\[([^\]\n]*`[^\]\n]*)\]/g
/** バッククォートを含むリンクのテキスト */
const LINK_TEXT = /\[([^\]\n]*`[^\]\n]*)\]\((?=[^)\n]*\))/g

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Document](node) {
      // ラベルの中のインラインコードを見たいので、Code ノードはマスクしない
      const masked = maskNodes(getSource(), node, ["Yaml", "CodeBlock", "Html"])

      const check = (pattern, where) => {
        for (const matched of masked.matchAll(pattern)) {
          const label = matched[1]
          const start = matched.index + matched[0].indexOf(label)
          report(
            node,
            new RuleError(
              `${where}の中ではインラインコードを使いません（バッククォートを外す）。`,
              {
                index: start,
                fix: fixer.replaceTextRange([start, start + label.length], label.replace(/`/g, ""))
              }
            )
          )
        }
      }

      check(LABEL, "`:Anki[]`・`:Mark[]` のラベル")
      check(LINK_TEXT, "リンクのテキスト")
    }
  }
}

export default {
  linter: reporter,
  fixer: reporter
}
