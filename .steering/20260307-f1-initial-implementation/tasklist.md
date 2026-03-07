# タスクリスト：F1 初回実装（要件1〜2）

## タスク一覧

### 1. 型定義
- [x] `app/src/lib/data/types.ts` を作成する（`PCCSColor`、`JISColor`、`ApproximateResult`、`AchromaticBucket`）

### 2. 色計算ロジック
- [x] `app/src/lib/color/convert.ts` を作成する（`hexToLab` および内部変換関数）
- [x] `app/src/lib/color/ciede2000.ts` を作成する（`deltaE2000`）
- [x] `app/src/lib/color/approximate.ts` を作成する（`findClosestPccs`）

### 3. ユニットテスト
- [x] `app/src/lib/color/convert.spec.ts` を作成する
- [x] `app/src/lib/color/ciede2000.spec.ts` を作成する
- [x] `app/src/lib/color/approximate.spec.ts` を作成する
- [x] `npm run test` を実行してすべてパスすることを確認する（16テスト全パス）

### 4. UIコンポーネント
- [x] `app/src/lib/components/ColorPicker.svelte` を作成する
- [x] `app/src/routes/approximate/+page.svelte` を作成する

### 5. レイアウト・トップページ
- [x] `app/src/routes/+layout.svelte` にナビゲーションバーを追加する
- [x] `app/src/routes/+page.svelte` をトップページとして整理する

### 6. 品質チェック
- [x] `npm run check` を実行して型エラーがないことを確認する（0 errors）
- [x] `npm run lint` を実行してLintエラーがないことを確認する（all passed）
