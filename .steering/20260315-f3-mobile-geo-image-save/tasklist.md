# F3：幾何パターン画像保存ボタンの改良 — タスクリスト

## タスク一覧

- [x] **T1** `GeoPatternSection.svelte` に Props `themeName: string` を追加
- [x] **T2** `useShareApi = $state(false)` を追加し、`onMount` で確定値をセット
- [x] **T3** `generatePngBlob` を切り出す（`canvas.toBlob` を Promise 化）
- [x] **T4** `downloadPng` を `generatePngBlob` を使って実装し直す
- [x] **T5** `sharePng` を追加（Web Share API 呼び出し、エラーハンドリング含む）
- [x] **T6** バウハウス・ジオメトリック両ボタンのラベル・ハンドラ・`disabled` 条件を更新
- [x] **T7** ヘルプテキスト `<p class="touch-hint">` を `<h2>` 直後に追加
- [x] **T8** `.touch-hint` スタイルと `@media (any-pointer: coarse)` による表示制御を追加
- [x] **T9** 親コンポーネント（`[theme]/+page.svelte`）に `themeName={theme.labelJa}` を追加

## 完了条件

- T1〜T9 の実装が完了し、`npm run check` がエラーなし
