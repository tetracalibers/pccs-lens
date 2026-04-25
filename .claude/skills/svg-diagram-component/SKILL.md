---
name: svg-diagram-component
description: 引数で指定された図の内容をもとに、SVGで描画するSvelteコンポーネントを実装するスキル。デモ用の図解コンポーネントを作成する際に使用。
---

# SVG図解コンポーネント実装スキル

このスキルは、引数で指定された図の内容を、SVGで描画するSvelteコンポーネントとして実装するためのガイドラインです。

## 入力

- **図の内容**（必須）: 描画したい図の説明・仕様
- **配置先パス**（任意）: コンポーネントファイルの配置場所

## ファイル配置

配置先パスが**指定されていない場合**:

- `app/src/lib/demo/[カテゴリ名]/` 配下にコンポーネントファイルを作成する
- カテゴリ名は図の内容から適切なものを判断する（例: `spectrum/`, `color-wheel/`, `tone/` など）
- 既存のカテゴリディレクトリがあればそれを使用し、なければ新規作成する

配置先パスが**指定されている場合**:

- 指定されたパスに作成する

## コンポーネント仕様

### 基本構造

- **Propsを持たない**コンポーネントとする
- ルート要素は `<svg>` 要素とし、`<div>` 等で包まない
  - 利用側で `app/src/lib/demo/SVGWrapper.svelte` と組み合わせて使う前提
- レスポンシブ対応のCSSは含めない
- `<svg>` 要素の `viewBox` は中身の図にフィットするサイズにする
  - `width`/`height` 属性は付与しない（`SVGWrapper` 側で `width: 100%; height: auto;` が指定される）

### 定数の宣言

レイアウトに関わる数値は `<script>` 内で定数として宣言し、後からカスタマイズしやすくする。

カスタマイズ可能にすべき定数の例:

- 図全体の幅・高さ（`WIDTH`, `HEIGHT`）
- 要素同士の隙間・余白（`GAP_*`, `PADDING_*`）
- ラベルのフォントサイズ（`FONT_SIZE_*`）
- 線の太さ（`STROKE_WIDTH_*`）
- 色（`COL_*` ※ `var(--color-body)` などのCSSカスタムプロパティを推奨）
- ブロック・要素のサイズ（`BLOCK_HEIGHT`, `MARKER_*` など）

定数名は `SCREAMING_SNAKE_CASE` で記述する。

### 矢印マーカーの形状

矢印を含む図の場合、`marker` 要素は以下の仕様で統一する（`app/src/lib/demo/spectrum/SpectrumRange.svelte` と同じ形状）:

```svelte
<!-- 左向き矢印 -->
<marker id="aL-{id}" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
  <polyline
    points="8,1 1,5 8,9"
    fill="none"
    stroke={strokeColor}
    stroke-width="1"
    stroke-linejoin="round"
  />
</marker>

<!-- 右向き矢印 -->
<marker id="aR-{id}" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
  <polyline
    points="1,1 8,5 1,9"
    fill="none"
    stroke={strokeColor}
    stroke-width="1"
    stroke-linejoin="round"
  />
</marker>
```

ポイント:

- `markerWidth="9"`, `markerHeight="10"`（高さ7・半底辺4 で正三角形に近い比率）
- `polyline` を使い、`fill="none"` で輪郭線のみ描画する
- `stroke-linejoin="round"` で角を丸める
- 矢印の色は線本体の色と一致させる（マーカーごとに `stroke` を指定）
- 同じ図の中で複数の色の矢印を使う場合は、IDサフィックスで区別する（例: `aL-k`, `aL-b`, `aL-r`）

### スタイル

- 不要なラッパー要素を含めないため、基本的に `<style>` ブロックは不要
- `<svg>` 自体に対するスタイルが必要な場合のみ最小限に記述する

## 実装テンプレート

```svelte
<script lang="ts">
  // ===== SVG dimensions =====
  const WIDTH = 960
  const HEIGHT = 400

  // ===== Layout constants =====
  const GAP_X = 20
  const FONT_SIZE_LABEL = 18
  const STROKE_WIDTH = 2

  // ===== Colors =====
  const COL_AXIS = "var(--color-body)"

  // ===== 図のデータ =====
  // ...
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <!-- 矢印マーカー（必要な場合） -->
  </defs>

  <!-- 図の本体 -->
</svg>
```

## 参考ファイル

実装の参考として `app/src/lib/demo/spectrum/SpectrumRange.svelte` を確認すること。以下の観点で参照する:

- 定数の命名・グルーピング方法
- `marker` 要素の定義
- `viewBox` の設定方法
- TypeScriptの型定義の書き方
