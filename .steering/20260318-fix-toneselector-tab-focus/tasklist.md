# タスクリスト：ToneSelector Tab キーフォーカス復帰バグ修正

## タスク

- [x] `handleTooltipKeydown` に `Tab` ケースを追加（preventDefault → hidePopover → triggerEls.focus）

## 完了条件

- `Tab` キーでポップオーバーが閉じ、フォーカスがトリガーセルに返る
- `Escape` / `ArrowDown` / `ArrowUp` の既存動作が壊れていない
