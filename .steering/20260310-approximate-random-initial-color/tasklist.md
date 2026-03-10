# タスクリスト：近似ページの初期色ランダム生成

## タスク

- [x] `app/src/routes/approximate/+page.svelte` を修正
  - [x] `randomcolor` のインポートを追加
  - [x] `randomHex()` 関数を追加
  - [x] `inputColor` の初期値フォールバックを `randomHex()` に変更
- [x] 動作確認
  - [x] ページリロードのたびに初期色が変わることを確認
  - [x] `?color=XXXXXX` のURLパラメータがある場合はその色が使われることを確認
