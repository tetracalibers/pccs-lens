# タスクリスト：ToneSelector アクセシビリティ改善

## タスク

- [x] `triggerEls` マップを追加し、グレイバケット `<g>` 要素の参照を保持
- [x] `$effect(tooltipGroupEl)` でツールチップ表示時に最初のボタンへ自動フォーカス
- [x] `closeTooltipWithFocus()` 関数を追加し、トリガーセルへのフォーカス返却を実装
- [x] `handleTooltipKeydown()` 関数を追加（ArrowDown / ArrowUp / Escape / Tab）
- [x] グレイバケット `<g>` に `bind:this`・`aria-haspopup="menu"`・`aria-expanded` を追加
- [x] グレイバケット `<g>` から `aria-pressed` を除去
- [x] ツールチップ `div` に `role="menu"`・`tabindex="-1"`・`onkeydown` を追加
- [x] サブトーンボタンに `role="menuitemcheckbox"`・`aria-checked` を追加
- [x] セル `onkeydown` から `Space` キーの処理を除外（Enter のみに限定）
- [x] `svelte-check` でエラー・警告がないことを確認

## 完了条件

- ToneSelector.svelte に関する `svelte-check` の警告が 0 件
- キーボードのみでグレイサブトーンを選択できる
