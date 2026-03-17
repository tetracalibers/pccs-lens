# 設計：ToneSelector Tab キーフォーカス復帰バグ修正

## 原因分析

### 問題の再現手順

1. グレイバケットセル（ltGy / mGy / dkGy）にフォーカスを当てる
2. `Enter` でポップオーバーを開く
3. ポップオーバー内で `Tab` を押す

### 期待動作

ポップオーバーが閉じ、フォーカスがトリガーセルに返る。

### 実際の動作

フォーカスがページ内の次の要素に移動し、ポップオーバーはライトディスミスで閉じるが、トリガーには戻らない。

### 根本原因

`ontoggle` ハンドラでのフォーカス復帰条件：

```js
} else if (document.activeElement === document.body || !document.activeElement) {
  triggerEls[cell.key]?.focus()
}
```

`Escape` キーはブラウザが自動的にフォーカスを `body` に移すため、この条件が成立してトリガーに戻る。
しかし `Tab` キーはフォーカスを「次の要素」に移してからライトディスミスが発火するため、`activeElement` が `body` にならず条件が成立しない。

## 修正アプローチ

`handleTooltipKeydown` に `Tab` ケースを追加し、以下を実行する：

1. `e.preventDefault()` でブラウザのデフォルト Tab 動作（フォーカス移動）を阻止
2. `popoverEls[bucketKey]?.hidePopover()` でポップオーバーを閉じる
3. `triggerEls[bucketKey]?.focus()` でトリガーセルにフォーカスを返す

`hidePopover()` 呼び出し時点での `document.activeElement` はまだポップオーバー内のボタンなので、`ontoggle` の既存条件は成立せず、二重のフォーカス操作も起きない。

## 変更するコンポーネント

- `app/src/lib/components/patterns/ToneSelector.svelte` の `handleTooltipKeydown` 関数のみ

## 影響範囲の分析

- `Escape` によるフォーカス復帰：`ontoggle` ハンドラが引き続き担当するため影響なし
- `ArrowDown` / `ArrowUp` ナビゲーション：変更なし
- ビジュアル・レイアウト：影響なし
