# 設計

## 実装アプローチ

`popover="auto"` 属性を tooltip div に付与し、ブラウザの Popover API に Escape・外側クリックによる閉じる処理を委譲する。

### Popover API が自動処理する機能

| 旧実装（手動JS） | Popover API |
|---|---|
| `keydown` で Escape 検知 → `closeTooltip()` | `popover="auto"` が自動処理 |
| `pointerdown` で外側クリック検知 → `closeTooltip()` | light dismiss が自動処理 |
| `scroll` / `resize` で `closeTooltip()` | **今回省略**（要件緩和） |

### JS側の変更

**削除:**
- `TooltipState` 型（`visible`, `cellKey`, `toneSymbol` の3フィールド）
- `$effect` ブロック全体（4つのイベントリスナー登録・解除）

**変更:**
- state: `tooltip: TooltipState` → `activeCellKey: string | null`
- `openTooltip()`: state更新 → `activeCellKey = cell.key; tooltipEl?.showPopover()`
- `closeTooltip()`: state更新 → `tooltipEl?.hidePopover()`

**追加:**
- `ontoggle` ハンドラ: light dismiss など外部要因で閉じた際に `activeCellKey = null` を同期

### HTML側の変更

- tooltip div を `{#if tooltip.visible}` 条件レンダリング → 常時DOMに存在（popoverで表示制御）
- `popover="auto"` 属性を付与
- `ontoggle` イベントハンドラを付与
- テンプレート内の `tooltip.toneSymbol` / `tooltip.cellKey` 参照を `activeCell.toneSymbol` / `activeCell.key` に変更

### CSS側の変更

- `border: none` を追加（popover のUA デフォルト border をリセット）
- `animation:` を `.tone-tooltip` から `.tone-tooltip:popover-open` に移動
  - 理由: popover は常時DOMに存在するため、マウント時ではなく表示時にアニメーションを発火させる必要がある

## 変更するコンポーネント

- `app/src/lib/components/index/ToneImageDiagram.svelte` のみ

## ついでに修正したバグ

無彩色スウォッチの背景色参照が誤っていた。

- 旧: `ACHROMATIC_BG[tooltip.toneSymbol]` → ltGy/mGy/dkGy は toneSymbol が `"Gy"` でキー不一致のため常に `#999` になっていた
- 新: `ACHROMATIC_BG[activeCell.key]` → `"ltGy"` / `"mGy"` / `"dkGy"` で正しく参照

## ブラウザ互換性

Popover API は Chrome 114+, Firefox 125+, Safari 17+ で対応。
