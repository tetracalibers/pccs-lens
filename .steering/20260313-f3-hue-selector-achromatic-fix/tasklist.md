# タスクリスト：無彩色選択時のHueSelectorサジェスト・スウォッチ表示の修正

## タスク

- [x] `ThemeColorPicker.svelte`: `HueSelector` へ `allowedHues` プロップを渡す
- [x] `HueSelector.svelte`: `allowedHues` プロップを追加
- [x] `HueSelector.svelte`: `allowedSet` を `$derived` で生成
- [x] `HueSelector.svelte`: `getSectorOpacity` / `getSwatchOpacity` を無彩色時は `allowedSet` 参照に変更
- [x] `HueSelector.svelte`: ラベルの `suggested` 判定を無彩色時は `allowedSet` 参照に変更
- [x] `HueSelector.svelte`: `getSwatchColor` を `getHueColor(h)` に変更（トーン連動・`achromaticHex` 廃止）

## 完了条件

すべてのタスク完了。動作確認済み。
