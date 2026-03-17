# 要求内容：グレイ細分ツールチップの Popover API リファクタリング

## 変更・追加する機能の説明

`ToneSelector.svelte` のグレイバケット（ltGy / mGy / dkGy）クリック時に表示されるグレイ細分ツールチップを、独自実装からブラウザネイティブの Popover API に切り替える。

## ユーザーストーリー

- ユーザーがグレイバケットセルをクリック／Enter すると、Gy-X.X の細分値一覧がポップオーバーとして表示される
- ポップオーバー外をクリックする（ライトディスミス）か Escape を押すと閉じる
- ポップオーバー内で ↑↓ キーによるフォーカス移動ができる
- 細分値を選択するとポップオーバーが閉じ、値が確定する

## 受け入れ条件

- ページ読み込み時にポップオーバーが表示されない
- ライトディスミスと Escape の動作が正しく機能する
- a11y 警告（`a11y_interactive_supports_focus`）が出ない
- CSS Anchor Positioning による左右自動切替が維持されている

## 制約事項

- CSS Anchor Positioning（`position-anchor` / `@position-try`）は既存のまま維持する
- Svelte 5 の記法（`$state`, `$derived`, `ontoggle` など）を使用する
