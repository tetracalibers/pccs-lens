# タスクリスト：フォーカスリングのアクセシビリティ改善

## タスク

### HueSelector.svelte

- [x] `focusedHue: number | null = $state(null)` 状態変数を追加
- [x] 扇形 `<path>` に `outline: none` + `onfocus`/`onblur` ハンドラを追加
- [x] 扇形フォーカスインジケータ（白外枠 + 青内枠 破線）を選択中インジケータループ内に追加
- [x] スウォッチ `<circle>` に `outline: none` + `onfocus`/`onblur` ハンドラを追加
- [x] スウォッチフォーカスインジケータ（白外枠 + 青内枠 円）を選択中スウォッチブロックの後に追加

### ToneSelector.svelte

- [x] `focusedKey: string | null = $state(null)` 状態変数を追加
- [x] `focusedSubTone: string | null = $state(null)` 状態変数を追加
- [x] セル `<g>` に `outline: none` + `onfocus`/`onblur` ハンドラを追加
- [x] 円形セルフォーカスインジケータを選択中インジケータブロックの後に追加
- [x] 矩形セルフォーカスインジケータを選択中インジケータブロックの後に追加
- [x] ツールチップサブアイテム `<g>` に `outline: none` + `onfocus`/`onblur` ハンドラを追加
- [x] ツールチップサブアイテムフォーカスインジケータを選択中インジケータブロックの後に追加

## 完了条件

- キーボード Tab でフォーカス移動した際、各要素の形状に合ったフォーカスリングが表示される
- ブラウザデフォルトの矩形フォーカスリングが表示されない
- 選択状態・未選択状態ともに正しく表示される
