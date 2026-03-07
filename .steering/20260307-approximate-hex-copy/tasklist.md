# タスクリスト：近似結果カードのHEXコード表示＋コピーボタン

## タスク一覧

- [x] 1. `CopyButton.svelte` を新規作成する
  - `text` prop を受け取る
  - コピーアイコン（SVGインライン）のみ表示するボタンを実装
  - `navigator.clipboard.writeText(text)` でコピー
  - `copied` ステートで 1500ms の `"Copied!"` ツールチップを制御
  - `aria-label` を付与

- [x] 2. `app/src/routes/approximate/+page.svelte` を修正する
  - `CopyButton` をインポートする
  - `.delta-e` の `<span>` を `<span class="hex-code">` + `<CopyButton>` に置き換える
  - `.delta-e` スタイルを削除し、`.hex-code` スタイルを追加する

- [x] 3. `docs/functional-design.md` を更新する
  - 「4. 機能1」の PCCSResultCard コンポーネント説明に「HEXコード・コピーボタン」を追記する

## 完了条件

- 近似結果カードにHEXコードが表示される
- コピーボタン（アイコンのみ）が表示され、押下でHEXコードがコピーされる
- コピー後 1500ms 間 `"Copied!"` ツールチップが表示される
- ΔE₀₀の表示が消えている
- `docs/functional-design.md` が実装と整合している
