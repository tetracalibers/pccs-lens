# 設計：GeoPatternSection の XSS 警告修正

## 実装アプローチ

### 検討した手法

**A. DOMPurify によるサニタイズ後に `{@html}` を継続使用**
- `DOMPurify.sanitize(svgString)` を通してから `{@html}` に渡す
- 依存ライブラリの追加が必要
- `{@html}` 自体は残るため lint ルールの抑制（`eslint-disable`）も別途必要になる

**B. `<img>` + SVG data URI**
- SVG 文字列を `encodeURIComponent` でエンコードし、`data:image/svg+xml;charset=utf-8,...` の data URI として `<img src>` に渡す
- `{@html}` を完全に除去できる
- `<img>` はスクリプトを実行しないため XSS リスクがない
- 外部依存なし
- SVG は `viewBox` 付きで自己完結しているため `<img>` でも正しくスケールされる
- PNG 保存フロー（SVG 文字列 → Blob → `<img>` → canvas）は変更不要

**C. Svelte action で `innerHTML` を直接操作**
- `bind:this` でコンテナを取得し、action 内で `element.innerHTML = svg` を設定
- `innerHTML` の使用は `{@html}` と同等のリスクがあり、lint を回避できても本質的な解決にならない

### 採用手法：B（`<img>` + SVG data URI）

`{@html}` を完全に除去でき、外部依存不要で最もシンプル。

## 変更するファイル

```
app/src/lib/components/patterns/GeoPatternSection.svelte
```

## 変更内容

### 追加

SVG 文字列から data URI を生成する `$derived` を 2 つ追加：

```ts
const bauhausSrc = $derived(
  bauhausSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bauhausSvg)}` : ''
)
const geometricSrc = $derived(
  geometricSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(geometricSvg)}` : ''
)
```

### 置き換え

```svelte
<!-- 変更前 -->
<div class="svg-wrapper">
  {@html bauhausSvg}
</div>

<!-- 変更後 -->
<div class="svg-wrapper">
  {#if bauhausSrc}
    <img src={bauhausSrc} alt="バウハウスパターン" />
  {/if}
</div>
```

### スタイル変更

```css
/* 変更前 */
.svg-wrapper :global(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* 変更後 */
.svg-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
}
```

`:global()` が不要になり、スコープ付きセレクタで記述できる。

## 影響範囲

| 範囲 | 影響 |
|---|---|
| パターンの表示 | 変更なし（viewBox 付き SVG を img で表示） |
| PNG 保存 | 変更なし（SVG 文字列を直接使用するフローは独立） |
| 型チェック | エラーなし |
| lint | `{@html}` 警告が解消される |
