# タスクリスト

## タスク

- [x] HueSelector: 全扇形を塗りつぶし表示に変更（`hasSectorFill` 廃止）
- [x] HueSelector: `allowedHues` prop・`allowedSet` derived を削除
- [x] HueSelector: `getSectorOpacity` / `getSwatchOpacity` を2段階に簡素化
- [x] ToneSelector: `allowedTones` prop・`allowedSet` derived を削除
- [x] ToneSelector: `getOpacity` を2段階に簡素化
- [x] ThemeColorPicker: HueSelector / ToneSelector への `allowedHues/allowedTones` の受け渡しを削除

## 変更ファイル

- `app/src/lib/components/patterns/HueSelector.svelte`
- `app/src/lib/components/patterns/ToneSelector.svelte`
- `app/src/lib/components/patterns/ThemeColorPicker.svelte`

## ステータス

完了
