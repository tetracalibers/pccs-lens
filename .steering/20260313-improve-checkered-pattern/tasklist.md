# tasklist.md — `/patterns`ページ市松模様の色選択アルゴリズム改良

## タスク一覧

- [x] 1. `app/src/lib/patterns/checkerboard-rules.ts` を新規作成
  - `ThemeId` ・ `SuggestOutput` を import
  - `CheckerboardRule` 型を定義（`base: SuggestOutput`, `assort: SuggestOutput`）
  - アイデアメモの内容を反映した `CHECKERBOARD_RULES` を全10テーマ分定義してエクスポート

- [x] 2. `app/src/routes/patterns/+page.svelte` を修正
  - `computeSuggest` の import を削除
  - `CHECKERBOARD_RULES` を import
  - `getCheckerboardColors` 内の `computeSuggest` 呼び出しを `CHECKERBOARD_RULES[themeId]` の参照に置き換える

- [x] 3. 動作確認
  - `npm run dev` でローカル起動し `/patterns` ページを確認
  - 各テーマの市松模様がイメージに合った色で表示されているか目視確認

- [x] 4. 型チェック・リント
  - `npm run check`
  - `npm run lint`

## 完了条件

- 全10テーマの市松模様が `effectiveRules` に基づく色で表示される
- 型エラー・リントエラーなし
- `/patterns/[theme]` 個別ページの動作に変化なし
