# タスクリスト

## タスク

- [x] `TooltipState` 型と `tooltip` state を削除し `activeCellKey: string | null` に置き換え
- [x] `openTooltip()` を `showPopover()` 呼び出しに変更
- [x] `closeTooltip()` を `hidePopover()` 呼び出しに変更
- [x] `$effect` ブロック（Escape / pointerdown / scroll / resize リスナー）を削除
- [x] tooltip div に `popover="auto"` を付与
- [x] `{#if tooltip.visible}` ラッパーを除去し常時DOM存在に変更
- [x] `ontoggle` ハンドラで `activeCellKey = null` を同期
- [x] テンプレート内の `tooltip.toneSymbol` / `tooltip.cellKey` 参照を `activeCell` ベースに置換
- [x] CSS: `border: none` 追加、`animation` を `:popover-open` セレクタに移動
- [x] バグ修正: 無彩色スウォッチの背景色参照を `activeCell.key` に修正

## 完了条件

- Popover API によって Escape・外側クリックで閉じることが確認できる
- CSS Anchor Positioning によるツールチップ位置制御が維持されている
- 開閉アニメーションが正常に動作する
