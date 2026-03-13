# 設計

## allowedSet と suggestedSet の関係整理

```
suggested ⊆ allowed ⊆ 全色相
```

| | allowedHues/allowedTones | suggestedHues/suggestedTones |
|---|---|---|
| **スコープ** | テーマ全体の許可範囲（静的） | ロール・選択色に基づく推奨値（動的） |
| **決定方法** | テーマ定義時に静的に設定 | `computeSuggest()` で毎回計算 |
| **UI での役割** | （今回の変更で UI 表示には不使用に） | opacity / 強調表示の基準 |

## 変更方針

### HueSelector.svelte

1. `allowedHues` prop を削除
2. `allowedSet` derived を削除
3. `{#if hasSectorFill(h)}` 分岐を削除し、全扇形を塗りつぶし表示に統一
4. `hasSectorFill()` 関数を削除
5. `getSectorOpacity()` / `getSwatchOpacity()` から `allowedSet` 分岐を削除し2段階に変更

### ToneSelector.svelte

1. `allowedTones` prop を削除
2. `allowedSet` derived を削除
3. `getOpacity()` から `allowedSet` 分岐を削除し2段階に変更

### ThemeColorPicker.svelte

- `allowedHues` / `allowedTones` を HueSelector・ToneSelector へ渡すのをやめる
- **注意**：ThemeColorPicker 自身の props には `allowedHues/allowedTones` を残す
  - `onHueSelect` 内の `chromaticAllowedTones`（有彩色トーンへの切り替えフォールバック）で使用
  - `onToneSelect` 内の `allowedHues[0]`（hueNumber が null のときのフォールバック）で使用

## 影響範囲

- `suggest.ts` の `computeSuggest()` には影響なし（`allowedHues/allowedTones` を引き続き参照）
- テーマ定義（`themes.ts`）には影響なし
- セレクタの表示のみ変更
