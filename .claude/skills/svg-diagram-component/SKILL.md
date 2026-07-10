---
name: svg-diagram-component
description: SVGで描画するSvelte製の図解コンポーネントを実装する際のガイドライン。`app/src/lib/demo/` 配下にSvelteコンポーネントを新規作成・編集する場合は必ずこのスキルを参照すること。引数で指定された図の内容をもとにデモ用の図解コンポーネントを作成する場合にも使用する。
---

# SVG図解コンポーネント実装スキル

このスキルは、SVGで描画するSvelte製の図解コンポーネントを実装するためのガイドラインです。

## 適用範囲

以下のいずれかに該当する場合は、必ずこのスキルを読んで内容に従うこと。

- `app/src/lib/demo/` 配下にSvelteコンポーネントを新規作成・編集するとき
- 引数で指定された図の内容をもとに、デモ用の図解コンポーネントを作成するとき

## 引数と実行パターン

このスキルは引数の構成に応じて次の3パターンで動作する。まず引数を解析してどのパターンかを判定してから、対応する手順を実行すること。

### パターンの判定

引数を次の順で調べてパターンを判定する。

1. 引数中に `TODO` から始まる文（例: `TODO: 明度対比により…`）が含まれる → **パターンC**
2. そうでなく、先頭トークンが `app/src/lib/demo/` 配下のディレクトリ名として妥当なもの（英字の kebab-case。例: `munsell`, `color-wheel`）→ **パターンB**（先頭トークンが `<配置先ディレクトリ>`、残りが `<図の内容>`）
3. いずれでもない（先頭が日本語の説明文）→ **パターンA**（引数全体が `<図の内容>`）

判定が曖昧で確信が持てない場合は、どのパターンとして解釈したかをユーザーに確認してから進めること。

### パターンA：`/svg-diagram-component <図の内容>`

- `app/src/lib/demo/[カテゴリ名]/` 配下にコンポーネントファイルを作成する
- カテゴリ名は図の内容から適切なものを判断する（例: `spectrum/`, `color-wheel/`, `tone/` など）
- 既存のカテゴリディレクトリがあればそれを使用し、なければ新規作成する
- 作成後、「完了報告」に従って import 文を提示する

### パターンB：`/svg-diagram-component <配置先ディレクトリ> <図の内容>`

- `<配置先ディレクトリ>` は `app/src/lib/demo` 配下のパス
  - 例：`/svg-diagram-component munsell <図の内容>` であれば `app/src/lib/demo/munsell/` にコンポーネントを作成する
- ディレクトリが存在しなければ新規作成する
- 作成後、「完了報告」に従って import 文を提示する

### パターンC：`/svg-diagram-component [配置先ディレクトリ] <TODOから始まる文> [図の内容]`

`<TODOから始まる文>` を指定するパターン。`<配置先ディレクトリ>` と `<図の内容>` はいずれも省略可能で、次のいずれの形でも指定できる。

- `/svg-diagram-component <配置先ディレクトリ> <TODOから始まる文> <図の内容>`
- `/svg-diagram-component <配置先ディレクトリ> <TODOから始まる文>`
- `/svg-diagram-component <TODOから始まる文> <図の内容>`
- `/svg-diagram-component <TODOから始まる文>`

手順:

1. `<TODOから始まる文>` がそのまま現れるページを `app/src/routes/color-theory`・`app/src/routes/color-fields` 配下から探す。

   ```bash
   grep -rn "<TODOから始まる文>" app/src/routes/color-theory app/src/routes/color-fields
   ```

   引数内での `<TODOから始まる文>` の範囲は、ページ内の該当行（`TODO` から始まる1行）と逐語一致する部分とする。その手前にある kebab-case トークンが `<配置先ディレクトリ>`、後に続く残りが `<図の内容>` にあたる。
2. コンポーネントを作成する。
   - `<配置先ディレクトリ>` が指定されていれば `app/src/lib/demo/<配置先ディレクトリ>/` 配下に作成する（パターンBと同じ）。省略されている場合はパターンAと同様に `app/src/lib/demo/[カテゴリ名]/` 配下に作成する。
   - `<図の内容>` が指定されていればそれを図の仕様とする。省略されている場合は `<TODOから始まる文>` の内容自体を図の仕様として用いる。
3. コンポーネントを作成したら、対象ページに対して次を行う。
   1. `<script>` ブロックに、作成したコンポーネントの import 文を追加する（`SVGWrapper` が未 import であればあわせて追加する）
   2. 本文中の `<TODOから始まる文>` の行を、`<SVGWrapper>` で包んだコンポーネントの使用箇所に置き換える（例: `<SVGWrapper>\n  <EmergencyExitSign />\n</SVGWrapper>`）

このパターンではページへの反映まで行うため、「完了報告」での import 文提示は不要。

## 完了報告

パターンA・パターンBでは、ページへの図の取り込みはユーザーが行うため、完了報告時に、作成したコンポーネントの import 文を次の形式で提示すること。

```
ページで使う場合は以下のようにimportしてください。

import EmergencyExitSign from "$lib/demo/color-visibility/EmergencyExitSign.svelte"
```

パターンCではページへの反映まで完了しているため、import 文の提示は不要。

## 品質チェック

- `npm run check` は**ユーザー側で実行する**。このスキルの作業中に勝手に実行しないこと。
- ユーザーが `npm run check` を実行してエラーや警告が出た場合は指示を出すので、その内容に従って修正する。

## コンポーネント仕様

### 基本構造

- **Propsを持たない**コンポーネントとする
- ルート要素は `<svg>` 要素とし、`<div>` 等で包まない
  - 利用側で `app/src/lib/demo/SVGWrapper.svelte` と組み合わせて使う前提
- レスポンシブ対応のCSSは含めない
- `<svg>` 要素の `viewBox` は中身の図にフィットするサイズにする
  - `width`/`height` 属性は付与しない（`SVGWrapper` 側で `width: 100%; height: auto;` が指定される）

### 図版のテキスト

- 図の内容で指示がない限り、**図版にテキスト（ラベル・見出し・注釈など）は入れない**
- テキストを入れる指示がある場合に限り、以下の関連項（「縦書きテキスト」「暗記モードでのテキスト非表示」「文字色のコントラスト確保」）に従う

### 描画方法

- 原則としてSVGはSvelteのテンプレート構文で組み立てる
- ただし、グラフや軸・スケールなど、d3を使用したほうが書きやすくなる場合は d3 を使用してもよい

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

### スペクトルのグラデーション

スペクトル（可視光の波長分布）を表すグラデーションの描画を指示された場合は、`app/src/lib/demo/spectrum/SpectrumGradient.svelte` と同様のグラデーション（`gradientStops` の波長と色の対応）を採用する。

### グラフの軸スタイル

グラフ（横軸・縦軸を持つ図）を描画する場合、ユーザーからの指定が特になければ、横軸・縦軸・軸ラベルのスタイル（線の太さ、目盛り、フォントサイズ、ラベル位置など）は `app/src/lib/demo/spectral-reflectance/SpectralReflectanceGraph.svelte` と統一する。

### 縦書きテキスト

テキストを縦書きにするよう指示された場合は、`<text>` 要素に `writing-mode="vertical-rl"` 属性を付与して実現する。

### 色の使い分け

- **PCCSの色を使用する**よう指示された場合は、`app/src/lib/data/pccs.ts` の `PCCS_HEX_MAP` などからHEXカラーコードを取得する
- **それ以外の色分け**（例: 「赤い線を描く」など）が指示された場合は、`app/src/lib/styles/color.css` で定義されている `--canvas-pen-*` を使用する

### 暗記モードでのテキスト非表示

暗記モードでテキストを隠すよう指示された場合は、以下の規則を守る。

- 非表示時に周囲のテキストの位置が変わらないよう、`visibility="hidden"` で隠す（`display="none"` などレイアウトに影響する方法は使わない）
- `<tspan>` を使う場合は、`<text>` 直下に生テキストを置かず、すべての文字列を必ず `<tspan>` で囲む

Bad:

```svelte
<text>
  <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>
  K
</text>
```

Good:

```svelte
<text>
  <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>
  <tspan dx="-0.4em">K</tspan>
</text>
```

### 文字色のコントラスト確保

塗りつぶし色の明暗差が場合によって大きく、文字が読みづらくなる可能性がある場合は、`app/src/lib/color/utils.ts` の `isLightColor` 関数によって文字色を出し分ける。指示がない限り、コンポーネント内で chroma.js の `luminance` 関数を直接使わない。

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

- `app/src/lib/demo/spectral-reflectance/SpectralReflectanceGraph.svelte`
  - グラフ（横軸・縦軸あり）のデフォルトスタイル
  - 軸・目盛り・軸ラベルの定数定義と配置方法
