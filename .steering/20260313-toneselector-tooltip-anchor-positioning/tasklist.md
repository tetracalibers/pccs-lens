# タスクリスト：ToneSelector グレー細分ツールチップの左右自動切替

## タスク

- [x] SVG ツールチップ（`<g>` / `<rect>`）を HTML ツールチップ（`<div>` / `<button>`）に置き換え
  - `tooltipGroupEl` の型を `SVGGElement | null` → `HTMLElement | null` に変更
  - `focusedSubTone` state と `onfocus`/`onblur` を削除し、CSS `:focus-visible` で代替
- [x] ラッパー `<div class="tone-selector-root">` を導入（`position: relative`）
- [x] グレーバケットセル用の不可視 HTML アンカー `<span class="cell-anchor">` を追加
  - viewBox 座標をパーセンテージに変換して絶対配置
  - `anchor-name` を設定
- [x] ツールチップに CSS Anchor Positioning を適用
  - `position: fixed` + `position-anchor`
  - `right: anchor(left)` でデフォルト左側表示
  - `@position-try --tooltip-right` で右側フォールバック定義
  - `position-try-order: most-width` で広い側を自動選択
- [x] インスタンス ID によるアンカー名のユニーク化
  - `Math.random().toString(36).slice(2, 8)` でインスタンスごとに ID 生成
  - `--tone-selector-{instanceId}-{key}` 形式のアンカー名を使用

## 完了条件

- [x] モバイルでツールチップが見切れない
- [x] 左側に十分なスペースがある場合は左側に表示される
- [x] 左側に収まらない場合は右側に自動切替される
- [x] ページ内に複数の ToneSelector を配置しても、操作したインスタンスのセルにツールチップが表示される
