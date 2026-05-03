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

矢印を含む図の場合、図の内容で指定がない限り**タイプA**を採用する。

#### タイプA（デフォルト）— `app/src/lib/demo/visual-effect-contrast/ContrastToneRelation.svelte` と同様

矢じりがマーカー枠の半分ほどの大きさに収まる、コンパクトで細身の「＞」形。線に対して控えめで洗練された印象になる。

関連定数は `<script>` 内で次のように宣言する:

```ts
// ===== 矢の形状 =====
const ARROW_HEAD_VIEWBOX = 7       // marker viewBox の一辺
const ARROW_HEAD_SIZE = 20         // 矢先のレンダリングサイズ（user space）
// marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE
```

マーカー定義:

```svelte
<marker
  id="arrow-{id}"
  viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
  refX={ARROW_HEAD_VIEWBOX / 2}
  refY={ARROW_HEAD_VIEWBOX / 2}
  markerWidth={ARROW_HEAD_SIZE}
  markerHeight={ARROW_HEAD_SIZE}
  markerUnits="userSpaceOnUse"
  orient="auto-start-reverse"
>
  <polyline
    points="0,3.5 3.5,1.75 0,0"
    fill="none"
    stroke={strokeColor}
    stroke-width={ARROW_HEAD_STROKE}
    stroke-linecap="round"
    stroke-linejoin="round"
    transform="translate(1.1667 1.75)"
  />
</marker>
```

使用例（始端・終端どちらにも同じマーカーを付ける）:

```svelte
<line ... marker-start="url(#arrow-{id})" marker-end="url(#arrow-{id})" />
```

ポイント:

- `markerUnits="userSpaceOnUse"` により `markerWidth`/`markerHeight` がユーザー座標になるため、線の太さが変わっても矢の大きさが変わらない
- `orient="auto-start-reverse"` で始端側は180°反転し、左右/上下どちらの矢印にも1マーカーで対応できる
- `ARROW_HEAD_STROKE` を `ARROW_STROKE_WIDTH` から逆算することで、線本体と矢先の太さを視覚的に揃える
- 同じ図の中で複数の色の矢印を使う場合は、IDサフィックスで区別する（例: `arrow-k`, `arrow-b`, `arrow-r`）

#### タイプB — `app/src/lib/demo/color-solid/ColorSolidSphere.svelte` の明度変化矢印と同様

矢じりがマーカー枠いっぱいに広がる、大きく開いた「＞」形。タイプAよりも矢じりが目立ち、存在感がある。

関連定数は `<script>` 内で次のように宣言する:

```ts
// ===== 矢の形状 =====
const ARROW_HEAD_W = 9    // markerWidth（横幅）
const ARROW_HEAD_H = 10   // markerHeight（縦幅）
```

マーカー定義:

```svelte
<!-- 左向き矢印 -->
<marker id="aL-{id}" markerWidth={ARROW_HEAD_W} markerHeight={ARROW_HEAD_H} refX="1" refY={ARROW_HEAD_H / 2} orient="auto">
  <polyline
    points="{ARROW_HEAD_W - 1},1 1,{ARROW_HEAD_H / 2} {ARROW_HEAD_W - 1},{ARROW_HEAD_H - 1}"
    fill="none"
    stroke={strokeColor}
    stroke-width="1"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</marker>

<!-- 右向き矢印 -->
<marker id="aR-{id}" markerWidth={ARROW_HEAD_W} markerHeight={ARROW_HEAD_H} refX={ARROW_HEAD_W - 1} refY={ARROW_HEAD_H / 2} orient="auto">
  <polyline
    points="1,1 {ARROW_HEAD_W - 1},{ARROW_HEAD_H / 2} 1,{ARROW_HEAD_H - 1}"
    fill="none"
    stroke={strokeColor}
    stroke-width="1"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</marker>
```

ポイント:

- `ARROW_HEAD_W=9`, `ARROW_HEAD_H=10`（半底辺4・高さ7 で正三角形に近い比率）
- `polyline` を使い、`fill="none"` で輪郭線のみ描画する
- `stroke-linejoin="round"` と `stroke-linecap="round"` で角と端を丸める
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

実装の参考として以下のファイルを確認すること。

- `app/src/lib/demo/visual-effect-contrast/ContrastToneRelation.svelte`
  - 定数の命名・グルーピング方法
  - タイプAの `marker` 要素の定義
  - TypeScriptの型定義の書き方

- `app/src/lib/demo/color-solid/ColorSolidSphere.svelte`
  - タイプBの `marker` 要素の定義
  - 動的な `viewBox` の算出方法
