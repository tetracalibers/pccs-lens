# タスクリスト：グレイ細分ツールチップの Popover API リファクタリング

## タスク

- [x] `openTooltipKey` / `tooltipGroupEl` の削除
- [x] 外部クリック検知 `$effect` の削除
- [x] フォーカス移動 `$effect` の削除
- [x] `closeTooltipWithFocus()` の削除
- [x] `popoverEls` / `openPopovers` / `getPopoverId()` の追加
- [x] SVG `<g>` の onclick / onkeydown を `togglePopover()` に変更
- [x] SVG `<g>` に `aria-controls` を追加
- [x] ツールチップを `<div popover="auto">` × 3 に変更（常時 DOM 配置）
- [x] `ontoggle` でフォーカス管理（開く：選択済み or 先頭ボタンへ、閉じる：body ならトリガーへ）
- [x] `handleTooltipKeydown` の簡素化（Escape / Tab ケース削除）
- [x] サブトーンボタンの `onclick` を `hidePopover()` に変更
- [x] サブトーンボタンの `onkeydown` 削除
- [x] a11y 警告修正：`role="menu"` に `tabindex="-1"` を追加
- [x] CSS 修正：`display: flex` を `:popover-open` に移動、`inset: auto` / `margin: 0` 追加

## 完了条件

- [x] ページ読み込み時にポップオーバーが非表示
- [x] クリック・Enter で開閉できる
- [x] ライトディスミス（外部クリック）で閉じる
- [x] Escape で閉じてトリガーにフォーカスが戻る
- [x] ↑↓ キーでボタン間を移動できる
- [x] a11y 警告なし
