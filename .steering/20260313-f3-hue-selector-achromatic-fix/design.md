# 設計：無彩色選択時のHueSelectorサジェスト・スウォッチ表示の修正

## 変更コンポーネント

- `app/src/lib/components/patterns/ThemeColorPicker.svelte`
- `app/src/lib/components/patterns/HueSelector.svelte`

## 変更内容

### ThemeColorPicker.svelte

`HueSelector` へ `allowedHues` プロップを渡すよう変更。

```svelte
<HueSelector
  value={...}
  suggestedHues={suggest.suggestedHues}
  allowedHues={allowedHues}   ← 追加
  selectedTone={selectedColor.toneSymbol}
  onselect={onHueSelect}
/>
```

### HueSelector.svelte

#### 1. プロップ追加

```ts
let {
  value,
  suggestedHues,
  allowedHues,   ← 追加
  selectedTone,
  onselect
}: {
  ...
  allowedHues: number[]   ← 追加
  ...
} = $props()
```

#### 2. allowedSet の導出

```ts
const allowedSet = $derived(new Set(allowedHues))
```

#### 3. 不透明度計算の変更

無彩色選択時は `allowedSet` を参照してフォールバックを 0.2 に。

```ts
function getSectorOpacity(h: number): number {
  if (isAchromaticSelected) return allowedSet.has(h) ? 1 : 0.2
  if (suggestedSet.has(h)) return 1
  return 0.2
}

function getSwatchOpacity(h: number): number {
  if (isAchromaticSelected) return allowedSet.has(h) ? 1 : 0.2
  if (suggestedSet.has(h)) return 1
  return 0.2
}
```

#### 4. ラベルのサジェスト強調の変更

```ts
{@const suggested = isAchromaticSelected ? allowedSet.has(h) : suggestedSet.has(h)}
```

#### 5. スウォッチ色の変更

`achromaticHex` を廃止し、常に `getHueColor(h)` を返すよう変更。
`getHueColor` は有彩色選択時は `lookupPCCSColor(h, selectedTone)?.hex`、
無彩色選択時は `HUE_COLORS[h]` を返すため、両ケースで正しく動作する。

```ts
function getSwatchColor(h: number): string {
  return getHueColor(h)
}
```

## 廃止したコード

```ts
// 削除
const achromaticHex = $derived(
  isAchromaticSelected ? (lookupPCCSColor(null, selectedTone)?.hex ?? "#aaaaaa") : null
)
```
