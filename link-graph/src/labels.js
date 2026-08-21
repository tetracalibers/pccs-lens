// ラベルの実寸（幅）を測る。
//
// 縦重なりをほどく後処理（declutter.js）は「箱と箱が横方向で重なっているか」で対象を絞るので、
// タイトルが実際に何 px になるかを知る必要がある。文字数 × 文字サイズでは日本語と英数字の
// 混在で外すので、Cytoscape が内部でやっているのと同じ手（canvas の `measureText`）で測る。
// フォントの指定は theme.js から取るので、描かれる幅と一致する。

import { LABEL_FONT_FAMILY, LABEL_FONT_SIZE } from "./theme.js"

/**
 * ラベルの幅を測る関数を作る。
 *
 * `measureText` はタイトル 1 本ごとに数十 μs だが、レイアウトを解くたびにノード数分呼ばれるので
 * 文字列でキャッシュする（タイトルは記事を書き換えたときしか変わらない）。
 *
 * @returns {(label: string) => number} 幅（px）
 */
export const createLabelWidths = () => {
  const context = document.createElement("canvas").getContext("2d")
  // Cytoscape の組み立てと同じ順（font-style → font-weight → font-size → font-family）。
  context.font = `normal normal ${LABEL_FONT_SIZE}px ${LABEL_FONT_FAMILY}`

  /** @type {Map<string, number>} */
  const cache = new Map()

  return (label) => {
    if (!label) return 0
    const known = cache.get(label)
    if (known !== undefined) return known
    const width = Math.ceil(context.measureText(label).width)
    cache.set(label, width)
    return width
  }
}
