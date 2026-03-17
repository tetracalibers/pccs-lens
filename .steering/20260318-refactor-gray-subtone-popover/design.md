# 設計：グレイ細分ツールチップの Popover API リファクタリング

## 実装アプローチ

### Before（独自実装）

| 機能 | 実装 |
|------|------|
| 表示制御 | `openTooltipKey` state + `{#if}` 条件レンダリング |
| ライトディスミス | `document.addEventListener("click", ...)` を `$effect` で管理 |
| Escape | `handleTooltipKeydown` 内で手動処理 |
| フォーカス（開く時） | `tooltipGroupEl` を `$effect` で監視して初回ボタンへフォーカス |
| フォーカス（閉じる時） | `closeTooltipWithFocus()` でトリガー `<g>` へ返却 |

### After（Popover API）

| 機能 | 実装 |
|------|------|
| 表示制御 | `popover="auto"` + `togglePopover()` / `hidePopover()` |
| ライトディスミス | ブラウザが自動処理（`popover="auto"` の組み込み機能） |
| Escape | ブラウザが自動処理 |
| フォーカス（開く時） | `ontoggle` で `:popover-open` 検知 → 選択済み or 先頭ボタンへフォーカス |
| フォーカス（閉じる時） | `ontoggle` で `document.activeElement === body` を検知 → トリガーへ返却 |

## 変更したコンポーネント

- `app/src/lib/components/patterns/ToneSelector.svelte`

## 主なコード変更

### 削除した state / ロジック

```ts
// 削除
let openTooltipKey: string | null = $state(null)
let tooltipGroupEl: HTMLElement | null = $state(null)

// 削除（外部クリック検知）
$effect(() => { document.addEventListener("click", close) ... })

// 削除（フォーカス移動 effect）
$effect(() => { tooltipGroupEl?.querySelector("button")?.focus() })

// 削除
function closeTooltipWithFocus() { ... }
```

### 追加した state

```ts
const GRAY_BUCKET_KEYS = new Set(["ltGy", "mGy", "dkGy"])
let popoverEls: Record<string, HTMLElement | null> = $state({})
let openPopovers: Record<string, boolean> = $state({})
function getPopoverId(key: string): string { ... }
```

### テンプレートの変更

- SVG `<g>` の `onclick` / `onkeydown`：`openTooltipKey` の操作 → `togglePopover()` 呼び出し
- SVG `<g>` に `aria-controls={getPopoverId(cell.key)}` を追加
- ツールチップ：`{#if openTooltipKey}` + 単一 `<div>` → 3 つの `<div popover="auto">` を常時 DOM に配置
- サブトーンボタンの `onclick`：`openTooltipKey = null` → `hidePopover()`
- サブトーンボタンの `onkeydown`（Enter）：button の標準動作で処理されるため削除

### CSS の変更

```css
/* Before */
.gray-subtone-tooltip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  ...
}

/* After：UA スタイルの display:none を上書きしないよう分離 */
.gray-subtone-tooltip {
  inset: auto;   /* ← 追加：UA デフォルトの inset:0 をリセット */
  margin: 0;     /* ← 追加：UA デフォルトの margin:auto をリセット */
  /* display: flex を削除 */
  ...
}

.gray-subtone-tooltip:popover-open {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
```

`display: flex` を `.gray-subtone-tooltip` に直接書くと UA スタイルの `display: none` を上書きしてしまい、ページ読み込み時に全ポップオーバーが表示される不具合が発生する。`:popover-open` 疑似クラスで条件付けることで解決。

## 影響範囲の分析

- `ToneSelector.svelte` のみ変更。外部インターフェース（props / emit）は変化なし。
- CSS Anchor Positioning の動作は変更なし。
- アクセシビリティ属性（`aria-haspopup`, `aria-expanded`, `aria-controls`, `role="menu"`, `tabindex="-1"`）は適切に維持。
