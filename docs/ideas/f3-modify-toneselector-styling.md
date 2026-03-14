## F3：トーン選択UIのスタイル仕様変更

`app/src/lib/components/patterns/ToneSelector.svelte`において、次の仕様変更を行う。

## セルの透明度の仕様変更

- 選択中であっても、サジェスト外のセルは薄く表示する

```ts
function getOpacity(key: string): number {
  if (suggestedSet.has(key)) return 1
  if (isSelected(key)) return 0.4
  return 0.2
}
```

## サジェストマーカーの変更

- サジェストマーカーは、そのセルを選択中の場合も表示するようにする
- サジェストマーカーを`boxicons:seal-check`アイコンに変更する

```ts
import Icon from "@iconify/svelte"
````

```jsx
<Icon icon="boxicons:seal-check" />
```

## セルのストロークカラーの変更

- セルのストロークカラーは、次のようにセルの塗りつぶし色に応じて設定する

```
oklch(from cellFillColorHex calc(l * .85) c h)
```

- 選択中インジケータ（外枠リング）の色は、次のように選択中の色に応じて設定する

```
hsl(from selectedColorHex h calc(s * 1.2) l)
```
