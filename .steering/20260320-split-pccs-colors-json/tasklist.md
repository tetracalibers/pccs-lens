# タスクリスト: PCCS Colors JSON 分割

## タスク

- [x] ステアリングドキュメント作成
- [x] 5つの分割JSONファイル生成（Node.jsスクリプトで一括出力）
- [x] `lookup.ts` を5ファイルインポートに更新
- [x] `ToneAreaDiagram.svelte` を5ファイルインポートに更新
- [x] `ToneImageDiagram.svelte` を5ファイルインポートに更新
- [x] `approximate/+page.svelte` を3ファイルインポートに更新
- [x] `analyze/+page.svelte` を3ファイルインポートに更新
- [x] 旧JSONファイル削除（pccs_colors.json, pccs_colors_full.json）
- [x] 旧CSVファイル削除（pccs_colors.csv, pccs_colors_full.csv）
- [x] `app/package.json` から `"convert"` スクリプト削除
- [x] `npm run check` で型エラーなしを確認（既存エラーのみ）

## 完了条件

- 分割JSONの合計件数 = 305件（重複なし・漏れなし） ✓
- 旧ファイルがすべて削除されている ✓
- 型チェックで新たなエラーなし ✓
