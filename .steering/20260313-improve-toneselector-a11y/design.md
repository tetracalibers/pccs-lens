# 設計：ToneSelector アクセシビリティ改善

## 実装アプローチ

### フォーカス管理

SVG `<g>` 要素（グレイバケットセル）への参照を `triggerEls` マップで保持し、ツールチップを閉じたときにフォーカスを返却できるようにする。

ツールチップ開閉は既存の `openTooltipKey` ステートで制御されているが、`tooltipGroupEl`（`bind:this` によるツールチップ要素の参照）が `$state` のため、`$effect` でその変化を検知してフォーカス移動を行う。

```
openTooltipKey が変化
→ {#if openTooltipKey} ブロックが描画
→ bind:this により tooltipGroupEl が更新
→ $effect(tooltipGroupEl) が発火
→ 最初のボタンに focus()
```

### キーボードナビゲーション

ツールチップ `div` に `onkeydown={handleTooltipKeydown}` を付与し、以下を処理する：

| キー | 動作 |
|------|------|
| `ArrowDown` | 次のボタンにフォーカス（末尾から先頭に循環） |
| `ArrowUp` | 前のボタンにフォーカス（先頭から末尾に循環） |
| `Escape` | ツールチップを閉じ、トリガーセルにフォーカスを返却 |
| `Tab` | ツールチップを閉じ、トリガーセルにフォーカスを返却 |
| `Space` | 割り当てなし（`<button>` のネイティブ動作に委ねる） |

`Space` をツールチップ外のセル開閉に割り当てない理由：ページスクロールとして使うユーザーの直感を妨げないため。ツールチップ内 `<button>` では HTML 標準の Space→クリック動作が自然に機能するため、明示的な制御は不要。

### ARIA 設計

**グレイバケットセル `<g>`**
- `aria-haspopup="menu"` : ポップアップメニューを持つことをスクリーンリーダーに伝える
- `aria-expanded={openTooltipKey === cell.key}` : 展開状態を動的に反映
- `aria-pressed` は除去（展開/折りたたみのセマンティクスは `aria-expanded` が担うため）

**ツールチップ `div`**
- `role="menu"` : メニューとして宣言
- `tabindex="-1"` : `role="menu"` に必要（直接タブ移動の対象にはしない）
- `aria-label="グレイ細分選択"` : 既存のまま維持

**サブトーンボタン**
- `role="menuitemcheckbox"` : 選択状態を持つメニューアイテム
- `aria-checked={isSubSelected}` : 現在選択中かを示す

## 変更するコンポーネント

- `app/src/lib/components/patterns/ToneSelector.svelte` のみ

## 影響範囲の分析

- ビジュアル・レイアウトへの影響なし
- ツールチップの開閉ロジックは既存のまま
- 外側クリックによる閉じる動作も既存のまま（フォーカス返却なし）
