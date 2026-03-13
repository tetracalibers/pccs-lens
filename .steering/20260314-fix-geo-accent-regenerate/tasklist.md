# タスクリスト：アクセントカラー追加・削除時の幾何パターン再生成

## タスク一覧

### T1. `GeoPatternSection.svelte` を修正する ✅

#### T1-1. `accentActive: boolean` prop を追加する ✅
#### T1-2. `_accentActive` plain 変数を追加する ✅
#### T1-3. `$effect` にアクセント変化の検知と再生成ロジックを追加する ✅

### T2. `[theme]/+page.svelte` を修正する ✅

#### T2-1. `GeoPatternSection` に `accentActive={showAccent && !!accentPCCS}` を渡す ✅

### T3. 型チェックで確認する ✅

- `npx svelte-check` でエラー 0 を確認

## 完了条件

- [x] アクセントカラー追加時に両パターンが再生成される
- [x] アクセントカラー削除時に両パターンが再生成される
- [x] 色相・トーン変更時は引き続き文字列置換のみで更新される
- [x] 型チェックが通る
