/**
 * 「同じ対象を表す記号は、インライン数式とインラインコードを混在させない」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * 記事の中でインライン数式（またはブロック数式）として書かれている記号が、別の箇所で
 * インラインコードになっている場合に、数式側へ揃える。添字・上付きは落として基底の記号で
 * 突き合わせるので、`$$T^{-1}$$` がある記事の `` `T` `` も対象になる。
 *
 * 数字は対象外（ガイドの明示）。`:::Action` のテキストも対象外。
 */

import { promotionRule } from "../lib/math-scope.js"

export default promotionRule(
  "article-symbol-unify",
  "article",
  (promotion) =>
    `この記事では同じ記号をインライン数式で書いているので、\`${promotion.content}\` も揃えてください（$$${promotion.math}$$）。`
)
