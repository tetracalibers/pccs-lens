/**
 * 「ブロック数式を説明する文では、その式の記号をインライン数式で書く」
 * （writing-guides/math-notation-guide.md）を検査する。
 *
 * ブロック数式が置かれた節の中で、その式に出てくる記号をインラインコードで書いている箇所を
 * インライン数式へ昇格させる。ガイドは「説明の文がブロック数式の直後にあるか少し離れているかは
 * 問いません」としているので、スコープは**見出しで区切った節**で取る。
 *
 * 数字は対象外（ガイドの明示）。降格（インライン数式 → インラインコード）はしない。
 */

import { promotionRule } from "../lib/math-scope.js"

export default promotionRule(
  "block-math-symbol-unify",
  "block",
  (promotion) =>
    `ブロック数式の記号を説明している文なので、\`${promotion.content}\` はインライン数式で書いてください（$$${promotion.math}$$）。`
)
