import type { Action } from "svelte/action"

/**
 * 要素を `document.body` 直下へ移動する Svelte アクション。
 *
 * `container-type` や `transform` を持つ祖先は `position: fixed` の包含ブロックに
 * なるため、その内側では fixed がビューポート基準にならない（レイアウトの
 * `.container` は `container-type: inline-size` を持つ）。body 直下へ逃がすことで、
 * スクロール位置に関わらずビューポート中央へ固定表示できるようにする。
 *
 * Svelte のスコープ付きクラスは要素に残るため、移動後もスタイルは適用される。
 * `{#if}` などで要素が破棄されると destroy で body から取り除かれる。
 */
export const portal: Action<HTMLElement> = (node) => {
  document.body.appendChild(node)
  return {
    destroy() {
      node.remove()
    }
  }
}
