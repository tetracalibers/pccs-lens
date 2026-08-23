/**
 * 「インラインコードの前後には空白を置かない」（writing-guides/math-notation-guide.md）を検査する。
 *
 * textlint-rule-ja-space-around-code は隣が日本語のときだけ見るため、
 * `$$\times$$ `1`チャンネル` のような英字・数式との境界を取りこぼす。
 * このルールは隣の文字種を問わず、境界のスペースを報告する。
 *
 * 例外:
 * - 行頭のマークアップ（リストマーカー `- `、引用 `> `、インデント）の直後
 * - 行末（コードの後ろが行末までスペースだけ）
 * - インライン数式との境界。「インライン数式の前後には半角スペースを置く」と
 *   衝突するため、数式側のルールを優先してスペースを残す（→ svx-inline-math-spacing）
 */

import { isSpace } from "../lib/svx.js"
import { forRule } from "../lib/rule-ids.js"

/** 行頭からコードまでがマークアップ（リスト・引用・インデント）だけか */
const isMarkupPrefix = (prefix) => /^\s*(?:[-*+]|\d+\.|>)?\s*$/.test(prefix)

/** ガイドのルールID（→ writing-guides/math-notation-guide.md） */
const RULE_ID = "no-space-around-inline-code"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource, fixer } = context
  return {
    [Syntax.Code](node) {
      const text = getSource()
      const [start, end] = node.range
      const length = end - start

      const before = text[start - 1]
      if (isSpace(before)) {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1
        const beforeSpace = text.slice(lineStart, start - 1)
        const atMathBoundary = beforeSpace.endsWith("$$")
        if (!isMarkupPrefix(text.slice(lineStart, start)) && !atMathBoundary) {
          report(
            node,
            new RuleError("インラインコードの前にスペースを入れません。", {
              index: -1,
              fix: fixer.replaceTextRange([-1, 0], "")
            })
          )
        }
      }

      const after = text[end]
      if (isSpace(after)) {
        const lineEnd = text.indexOf("\n", end)
        const restOfLine = lineEnd === -1 ? text.slice(end) : text.slice(end, lineEnd)
        const atLineEnd = /^\s*$/.test(restOfLine)
        const atMathBoundary = text.slice(end + 1).startsWith("$$")
        if (!atLineEnd && !atMathBoundary) {
          report(
            node,
            new RuleError("インラインコードの後にスペースを入れません。", {
              index: length,
              fix: fixer.replaceTextRange([length, length + 1], "")
            })
          )
        }
      }
    }
  }
}

const rule = forRule(RULE_ID, reporter)

export default {
  linter: rule,
  fixer: rule
}
