# タスクリスト：ToneSelector グレー細分ツールチップの操作性改善

## タスク

- [x] `hoveredGrayKey` を `openTooltipKey` にリネームし、クリックトグル方式に変更
- [x] グレーバケットセルのイベントハンドラを hover → click に変更
  - `onmouseenter` / `onmouseleave` を削除
  - `onclick` でトグル処理（同じセル再クリックで閉じる）
  - グレーバケット以外のセルは従来通り `onselect(cell.key)` を呼び出す
- [x] サブトーン選択時にツールチップを閉じる（`openTooltipKey = null`）
- [x] ツールチップ外クリックで閉じる実装
  - SVGルート `onclick` 方式 → `a11y_no_noninteractive_element_interactions` 警告が発生したため廃止
  - `document.addEventListener` + `tooltipGroupEl.contains(e.target)` 方式に変更
- [x] ツールチップ `<g>` の `onclick` 伝播阻止を削除
  - `bind:this={tooltipGroupEl}` に置き換え、`$effect` 内の `contains()` で代替

## 完了条件

- [x] セルクリックでツールチップが開閉する
- [x] 同じセルを再クリックするとトグルで閉じる
- [x] サブトーンを選択するとツールチップが閉じる
- [x] ツールチップ外をクリックするとツールチップが閉じる
- [x] Svelte a11y 警告が発生しない
