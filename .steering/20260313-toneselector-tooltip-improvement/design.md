# 設計：ToneSelector グレー細分ツールチップの操作性改善

## 変更ファイル

- `app/src/lib/components/patterns/ToneSelector.svelte`

## 実装アプローチ

### 状態管理

| 変数 | 変更前 | 変更後 |
|------|--------|--------|
| `hoveredGrayKey` (hover中のキー) | `$state(null)` | 廃止 |
| `openTooltipKey` (開いているトーンのキー) | なし | `$state(null)` で新設 |
| `tooltipGroupEl` (ツールチップDOMノード) | なし | `$state(null)` で新設、`bind:this` で取得 |

### ツールチップの開閉ロジック

```
グレーバケットセルをクリック
  → e.stopPropagation()（document リスナーへの伝播を阻止）
  → openTooltipKey === cell.key なら null（トグルで閉じる）
  → それ以外なら cell.key をセット（開く）

サブトーンを選択
  → onselect(subTone.notation) を呼び出す
  → openTooltipKey = null（ツールチップを閉じる）

ツールチップ外クリック（document レベル）
  → tooltipGroupEl.contains(e.target) が false なら openTooltipKey = null
```

### クリック外閉じの実装（a11y 警告回避）

当初は SVG ルートの `onclick` でツールチップ外クリックを検知していたが、
`<svg>` は非インタラクティブ要素であるため `a11y_no_noninteractive_element_interactions` 警告が発生。

同様に、ツールチップ `<g role="group">` に `onclick={(e) => e.stopPropagation()}` を設置する案も、
`<g>` が非インタラクティブ要素であるため同じ警告が発生。

#### 採用した解決策

`$effect` 内で `document.addEventListener("click", ...)` を使い、
クリック対象が `tooltipGroupEl.contains(e.target)` 内かどうかを判定する。

```typescript
$effect(() => {
  if (!openTooltipKey) return
  const close = (e: MouseEvent) => {
    if (tooltipGroupEl?.contains(e.target as Node)) return
    openTooltipKey = null
  }
  document.addEventListener("click", close)
  return () => document.removeEventListener("click", close)
})
```

- ツールチップが開いている間だけリスナーを登録し、閉じたら自動解除する
- `<g>` や `<svg>` にイベントを付与しないため、a11y 警告が発生しない
- `bind:this={tooltipGroupEl}` は `{#if}` ブロック内でも正常に動作する（非表示時は `null` になる）

### 非インタラクティブ要素へのイベント付与を避ける原則

| 要素 | 対応 |
|------|------|
| クリック可能なセル `<g>` | `role="button"` + `tabindex="0"` を付与（インタラクティブ化） |
| ツールチップ外クリック | `<svg>` や `<g>` ではなく `document` リスナー + `contains()` で判定 |
| ツールチップ内クリック伝播阻止 | `<g>` への `onclick` 付与をやめ、`bind:this` + `contains()` で代替 |
