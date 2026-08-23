/**
 * 「インライン数式を含む文では、数式・変数・関数名をインライン数式に統一する」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * 1つの文の中にインライン数式が1つでもあれば、その文のインラインコードで書かれた
 * 数式・変数記号・関数名をインライン数式へ昇格させる。判定は文単位で、
 * インライン数式を含まない文には及ばない。
 *
 * 数字は対象外（ガイドの明示）。`:::Action` のテキストも対象外。
 */

import { promotionRule } from "../lib/math-scope.js"

export default promotionRule(
  "sentence-math-unify",
  "sentence",
  (promotion) =>
    `インライン数式を含む文なので、\`${promotion.content}\` もインライン数式で書いてください（$$${promotion.math}$$）。`
)
