# 設計：ToneSelector グレー細分ツールチップの左右自動切替

## 変更ファイル

- `app/src/lib/components/patterns/ToneSelector.svelte`

## 実装アプローチ

### CSS Anchor Positioning の採用

ツールチップの位置を CSS Anchor Positioning で制御する。

- `position: fixed` + `position-anchor` でアンカー基準に配置
- `@position-try --tooltip-right` で右側フォールバックを定義
- `position-try-order: most-width` により、より広いスペースがある側を自動選択

```css
.gray-subtone-tooltip {
  position: fixed;
  position-try-fallbacks: --tooltip-right;
  position-try-order: most-width;

  /* デフォルト：左側 */
  right: anchor(left);
  margin-right: 8px;
  top: anchor(center);
  translate: 0 -50%;
}

@position-try --tooltip-right {
  right: unset;
  left: anchor(right);
  margin-right: 0;
  margin-left: 8px;
}
```

### SVG 要素は anchor-name 非対応

SVG の `<g>` 要素は CSS レイアウトシステムに参加しないため、
`anchor-name` プロパティが機能しない（ブラウザに定義なしとして扱われる）。

`foreignObject` 内の HTML 要素も同様に機能しなかった。

#### 採用した解決策：不可視 HTML アンカーを絶対配置で重ねる

SVG の外側（ラッパー `div` 内）に、グレーバケットセルと同じ位置・サイズの
不可視 `<span>` を `position: absolute` で配置し、これに `anchor-name` を設定する。

SVG の `viewBox` 座標をパーセンテージに変換することで、
SVG のスケールに追従した正確な位置に配置できる。

```
left  = (cell.cx - RECT_W / 2) / SVG_W * 100%
top   = (cell.cy - RECT_H / 2) / SVG_H * 100%
width = RECT_W / SVG_W * 100%
height= RECT_H / SVG_H * 100%
```

### ラッパー div の導入

```html
<div class="tone-selector-root">   <!-- position: relative -->
  <svg>...</svg>
  <span class="cell-anchor" />     <!-- 不可視アンカー × 3 -->
  <div class="gray-subtone-tooltip" />  <!-- ツールチップ -->
</div>
```

### SVG ツールチップ → HTML ツールチップへの変更

従来は SVG `<g>` / `<rect>` でツールチップを描画していたが、
CSS Anchor Positioning は HTML 要素に対して機能するため、
ツールチップを HTML `<div>` + `<button>` に置き換えた。

| 変更前 | 変更後 |
|--------|--------|
| SVG `<g role="group">` | HTML `<div role="group">` |
| SVG `<rect>` + `<text>` | HTML `<button>` （背景色を `style` で指定） |
| `focusedSubTone` state + onfocus/onblur | CSS `:focus-visible` 疑似クラス |
| `tooltipGroupEl: SVGGElement` | `tooltipGroupEl: HTMLElement` |

### インスタンスごとのアンカー名ユニーク化

ページ内に複数の `ToneSelector` が配置された場合、同じ `anchor-name` を持つ要素が
複数存在すると、ブラウザは最後に定義されたアンカーを参照してしまう。

コンポーネント初期化時にランダムな ID を生成し、アンカー名に含めることで衝突を防ぐ。

```typescript
const instanceId = Math.random().toString(36).slice(2, 8)

function getAnchorName(key: string): string {
  return `--tone-selector-${instanceId}-${key}`
}
// 例: --tone-selector-abc123-ltGy
```
