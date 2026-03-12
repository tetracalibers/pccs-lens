# 設計：フォーカスリングのアクセシビリティ改善

## 実装アプローチ

**Svelte状態管理 + カスタムSVGフォーカスインジケータ**

ブラウザデフォルトのフォーカスアウトラインを `outline: none` で非表示にし、Svelte の `$state` で管理するフォーカス状態に基づいてカスタムSVGフォーカスインジケータを描画する。

## フォーカスインジケータのスタイル

選択中インジケータと区別できる見た目にする（白外枠 + 青内枠 + 破線）：

| 要素 | 外枠 | 内枠 |
|------|------|------|
| 扇形（選択中） | `stroke="white" stroke-width="3"` | `oklch(... calc(l*.75) ...)` solid |
| 扇形（フォーカス） | `stroke="white" stroke-width="2"` dasharray="3 2" | `stroke="#3b82f6"` stroke-width="1.5" dasharray="3 2" |
| スウォッチ（フォーカス） | `stroke="white" stroke-width="2"` | `stroke="#3b82f6"` stroke-width="1.5" |
| 円形セル（フォーカス） | `stroke="white" stroke-width="2"` dasharray="3 2" | `stroke="#3b82f6"` stroke-width="1.5" dasharray="3 2" |
| 矩形セル（フォーカス） | `stroke="white" stroke-width="2"` dasharray="3 2" | `stroke="#3b82f6"` stroke-width="1.5" dasharray="3 2" |

フォーカスと選択が同時の場合は選択インジケータを優先（`!selected` / `!isSelected` 条件でフォーカスインジケータを非表示）。

## 変更コンポーネント

### HueSelector.svelte

**状態変数：**
```ts
let focusedHue: number | null = $state(null)
```

**扇形 `<path>`：**
- `style` に `outline: none` を追加
- `onfocus={() => (focusedHue = h)}` / `onblur={() => (focusedHue = null)}` を追加

**フォーカスインジケータ（扇形）：** 選択中インジケータ `{#each}` ループ内に追加
```svelte
{#if focusedHue === h && !isSelected(h)}
  <path d={sectorPath(h)} fill="none" stroke="white" stroke-width="2"
    stroke-dasharray="3 2" style="pointer-events: none;" />
  <path d={sectorPath(h)} fill="none" stroke="#3b82f6" stroke-width="1.5"
    stroke-dasharray="3 2" style="pointer-events: none;" />
{/if}
```

**スウォッチ `<circle>`：**
- `style` に `outline: none` を追加
- `onfocus`/`onblur` を追加

**フォーカスインジケータ（スウォッチ）：** 選択中スウォッチブロックの後に追加
```svelte
{#if focusedHue === h && !selected}
  <circle ... r={SWATCH_R + 3} fill="none" stroke="white" stroke-width="2" ... />
  <circle ... r={SWATCH_R + 3} fill="none" stroke="#3b82f6" stroke-width="1.5" ... />
{/if}
```

### ToneSelector.svelte

**状態変数：**
```ts
let focusedKey: string | null = $state(null)
let focusedSubTone: string | null = $state(null)
```

**セル `<g>` 要素：**
- `style` に `outline: none` を追加
- `onfocus={() => (focusedKey = cell.key)}` / `onblur={() => (focusedKey = null)}` を追加

**フォーカスインジケータ（セル）：** 選択中インジケータブロックの後に追加（circle / square を分岐）
- circle: `r={CIRCLE_R + 4}` の円ストローク2本（白外枠 + 青内枠）
- square: `4px` 外側の矩形ストローク2本（白外枠 + 青内枠）

**ツールチップのサブアイテム `<g>`：**
- `style` に `outline: none` を追加
- `onfocus={() => (focusedSubTone = subTone.notation)}` / `onblur={() => (focusedSubTone = null)}` を追加

**フォーカスインジケータ（サブアイテム）：** 選択中インジケータブロックの後に追加
- 白外枠 + 青内枠の矩形ストローク

## 影響範囲

- `app/src/lib/components/patterns/HueSelector.svelte`
- `app/src/lib/components/patterns/ToneSelector.svelte`
- ロジック・データ構造の変更なし
- 他コンポーネントへの影響なし
