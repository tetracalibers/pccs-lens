/**
 * 「インライン数式はなるべく使わず、インラインコードで書く」
 * （writing-guides/math-notation-guide.md）の**残差**を報告する。
 *
 * KaTeX 必須記号を含まない `$$…$$` を素朴に数えると、全記事857件中478件が候補に挙がる。
 * その大半はブロック数式の記号を説明している `$$t$$`・`$$C(t)$$` で、維持が正しい。
 * このルールは、上位の3つ（ブロック数式の説明文・文単位の統一・記事全体の統一）に
 * 拾われなかったものだけを降格候補として出す（→ lib/math-scope.js）。
 *
 * **自動修正しない。** 降格の根拠は「上の3つに拾われなかったこと」なので、スコープ検出の
 * 取りこぼしがそのまま誤修正になる。判断は `/format-math-notation` に任せる。
 */

import { analyze } from "../lib/math-scope.js"

const reporter = (context) => {
  const { Syntax, RuleError, report, getSource } = context
  return {
    [Syntax.Document](node) {
      const { demotions } = analyze(getSource(), node)
      for (const math of demotions)
        report(
          node,
          new RuleError(
            `$$${math.body}$$ は KaTeX でしか書けない記号を含まず、ブロック数式・同じ文・記事全体のどの統一にも掛かりません。インラインコードにできないか確認してください。`,
            { index: math.start }
          )
        )
    }
  }
}

export default { linter: reporter }
