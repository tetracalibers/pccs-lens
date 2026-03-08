# タスクリスト：F2 セクション1 - カラーコード入力とPCCS近似色の編集（機能1・3）

## タスク一覧

### T1: `ColorEntryItem.svelte` を作成する

- [ ] `app/src/lib/components/ColorEntryItem.svelte` を新規作成
- [ ] props定義（inputHex / selectedPCCS / alternatePCCS / showRemove / onHexChange / onSelectAlternate / onRemove）
- [ ] ColorPickerの組み込みと削除ボタン（showRemoveによる表示制御）
- [ ] 近似色スウォッチ＋PCCS表記の表示
- [ ] 代替候補スウォッチ×2（クリックで onSelectAlternate を呼ぶ）
- [ ] スタイリング

### T2: `analyze/+page.svelte` を作成する

- [ ] `app/src/routes/analyze/+page.svelte` を新規作成
- [ ] `randomHex()` / `makeEntry(hex)` / `initialEntries()` の実装
- [ ] `entries` を `$state` で管理
- [ ] `addEntry()` / `removeEntry(id)` の実装
- [ ] `onHexChange(id, hex)` の実装（再計算ロジック）
- [ ] `onSelectAlternate(id, alternate)` の実装（代替候補昇格ロジック）
- [ ] テンプレート：`ColorEntryItem` のリスト表示
- [ ] テンプレート：「＋ 色を追加」ボタン（6色時非表示）
- [ ] スタイリング

### T3: 動作確認

- [ ] 初期表示で2色がランダムな色で表示される
- [ ] 色を変更すると近似色・代替候補が再計算される
- [ ] 「＋」で最大6色まで追加できる（6色時「＋」非表示）
- [ ] 「×」で最小2色まで削除できる（2色時「×」非表示）
- [ ] 代替候補クリックで近似色が入れ替わる（旧近似色が代替候補に戻る）
- [ ] `npm run check` でTypeScriptエラーなし

## 完了条件

- 受け入れ条件（requirements.md）の全項目を満たしていること
- TypeScriptの型エラーなし
