# タスクリスト：URLによるカラーコード共有

## タスク一覧

### 1. `+page.svelte` の実装
- [x] `page`（`$app/stores`）と `replaceState`（`$app/navigation`）のインポートを追加
- [x] `isValidHex6` バリデーション関数を追加
- [x] `inputColor` の初期化を URL パラメータ読み取り対応に変更
- [x] `$effect` で `inputColor` 変更時に URL を更新する処理を追加

### 2. `docs/product-requirements.md` の更新
- [x] 「将来的な追加候補」の `URLによる配色の共有機能` を正式機能の記述に移動・更新

## 完了条件

- [x] `/approximate` にパラメータなしでアクセス → `#EE0026` でデフォルト表示
- [x] 色を変更すると URL が `?color=RRGGBB` に更新される
- [x] `?color=RRGGBB` 付き URL で開くと同じ色が復元される
- [x] テキスト入力の途中では URL が変化しない
- [x] 不正なパラメータは無視されデフォルト色で動作する
