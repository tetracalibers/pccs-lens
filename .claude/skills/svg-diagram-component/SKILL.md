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

引数の形はどのパターンでも共通で、次のとおり。

```
/svg-diagram-component [配置先ディレクトリ] <図の指定>
```

先頭の角括弧は**リテラル**（省略可を表す記法ではなく、実際に `[` `]` で囲んで渡す）。

```
/svg-diagram-component [munsell] マンセル色立体の水平断面図
/svg-diagram-component 水晶体分光透過率のグラフ
```

- **`[配置先ディレクトリ]`（省略可・先頭）** … カテゴリディレクトリ（`app/src/lib/demo/color/` または `app/src/lib/demo/cg/`）配下のディレクトリ名（英字の kebab-case。例: `[munsell]`, `[color-wheel]`）。指定する場合は引数の**先頭**に、角括弧で囲んで置く。角括弧で囲まれていないものは配置先ディレクトリとして扱わない。

  カテゴリ（`color/`・`cg/`）は引数に含めず、後述の「配置先のカテゴリ」で決めるのが基本。`[cg/lighting]` のようにカテゴリを含めて渡された場合はその指定に従う。

- **`<図の指定>`（必須）** … 作りたい図の名前・内容。

  ページ内のプレースホルダ（`:::Todo` ディレクティブ）に対応する図を作る場合は、**ディレクティブの中身（図の名前）だけ**を渡す。`:::Todo` の行と閉じの `:::` は引数に含めない。

  ```
  :::Todo
  水晶体分光透過率のグラフ
  :::
  ```

  上のプレースホルダに対する引数は `水晶体分光透過率のグラフ` になる。**`TODO：` のような接頭辞も付かない。** 図版のTODOは `:::Todo` ディレクティブで書き、図の名前はその本文に書くのが現行の規約（`writing-guides/syntax-guide.md` ルール4）。図の名前に続けて、描き方の補足が書き足されることもある。

  **`:::Add` / `:::Delete` / `:::Edit` / `:::Modify` は図版のプレースホルダではない。** `:::Add` は文章の加筆メモ、`:::Delete` は削除予定の記述（どちらも `author-style-writer` の担当）、`:::Edit` / `:::Modify` は**すでにあるもの**への修正指示なので、いずれもこのスキルの対象から外す。図版のプレースホルダは `:::Todo`（属性を取らない）だけ。`:::Modify{target="svg"}` は既存のSVG図解の修正依頼なので、新規作成のこの手順ではなく個別の修正作業として扱う。

### 配置先のカテゴリ

`app/src/lib/demo/` の直下はページのカテゴリで分かれている。図解コンポーネントは必ずどちらかのカテゴリの下に作り、**`app/src/lib/demo/` の直下には作らない。**

| 対象ページ | 配置先 |
| --- | --- |
| 色彩ページ（`app/src/routes/color-theory/**`・`app/src/routes/color-fields/**`） | `app/src/lib/demo/color/<配置先ディレクトリ>/` |
| CGページ（`app/src/routes/cg/**`） | `app/src/lib/demo/cg/<配置先ディレクトリ>/` |

- パターンC（プレースホルダが見つかった場合）は、**ヒットしたページのパスでカテゴリを決める。**
- パターンA・B（対象ページが特定できない場合）は図の主題で判断する。色彩（色の理論・配色・視覚のしくみなど）の図なら `color/`、CG（3DCG・座標変換・モデリング・レンダリングなど）の図なら `cg/`。判断がつかない場合はユーザーに確認する。
- `app/src/lib/demo/threejs/` は `add-threejs-demo` スキルが扱う Three.js デモの置き場所。SVG図解コンポーネントはここには作らない。
- `app/src/lib/demo/` 直下の `SVGWrapper.svelte`・`CanvasWrapper.svelte`・`PlaybackStage.svelte` はカテゴリ共通のコンポーネントで、これらは例外。

### パターンの判定

接頭辞（かつての `TODO：`）では判定できないため、**ページ内のプレースホルダを実際に検索して**判定する。

1. 引数の先頭が `[...]` の形であれば、その中身を `<配置先ディレクトリ>` として切り出し、残りを `<図の指定>` とする。先頭が `[` でなければ配置先ディレクトリの指定なしとみなし、引数全体を `<図の指定>` とする。裸の `munsell 〜` のように角括弧のないものを配置先ディレクトリと推測してはならない。配置先ディレクトリの指定がない場合は、後述の「配置先ディレクトリの決定（省略時）」に従ってユーザーに選ばせる。
2. `<図の指定>` に対応するプレースホルダをページから検索する（→「プレースホルダの検索」）。
   - **見つかった** → **パターンC**（コンポーネント作成に加えてページへの反映まで行う）
   - **見つからない** → `<配置先ディレクトリ>` があれば **パターンB**、なければ **パターンA**（コンポーネント作成のみ）

判定が曖昧で確信が持てない場合は、どのパターンとして解釈したかをユーザーに確認してから進めること。

### プレースホルダの検索

`app/src/routes` 配下を全文検索する（`color-theory`・`color-fields`・`cg` のいずれにもプレースホルダがある）。

```bash
# 例: 引数が「水晶体分光透過率のグラフ」なら
grep -rn "水晶体分光透過率のグラフ" app/src/routes
```

- 引数は `:::Todo` ブロックの本文をそのまま渡したものであることが多いので、まずは `<図の指定>` 全体で検索する。
- **ヒットした箇所が `:::Add` / `:::Delete` / `:::Edit` / `:::Modify` ブロックの中なら、プレースホルダとして扱わない。** 文章の加筆メモ・削除予定の記述・既存のものへの修正指示なので、図版の新規依頼としては見つからなかったものとみなす（パターンA／Bへ倒す）。ヒット行の直前のブロック開始行が `:::Todo` であることを必ず確かめる。

  ```bash
  # ヒットしたページで、図版のTODOだけを見る
  grep -n ':::Todo' <ヒットしたページ>
  ```

- ヒットしない場合は、`<図の指定>` の先頭から特徴的な名詞句を切り出して再検索する。引数が「図の名前＋描き方の補足」になっている場合、ページ側と逐語一致した範囲が `<図の名前>`、残りが `<図の内容>`（描き方の指定）にあたる。
- 規約導入前に書かれたページには、HTMLコメント（`<!-- TODO: 〜の図解 -->`）や地の文の `TODO：〜` の形のプレースホルダも残っている。図の説明部分での検索はこの3形式のいずれにもヒットするので、見つかった形に応じてパターンCの置き換え範囲を決める。
- 複数のページ・複数箇所にヒットした場合や、ヒットした箇所がプレースホルダかどうか判断がつかない場合は、ユーザーに確認してから進める。
- 何もヒットしない場合は、ページに存在しない新規の図の依頼としてパターンA／Bで進める（ページには一切触れない）。

### 配置先ディレクトリの決定（省略時）

`<配置先ディレクトリ>` の指定がない場合（パターンA、および配置先ディレクトリを省略したパターンC）は、**カテゴリ名を勝手に決めない。** コンポーネントファイルの作成に着手する前に、次の手順でユーザーに選ばせる。

1. 「配置先のカテゴリ」に従って `color/` か `cg/` かを決め、そのカテゴリ配下の既存ディレクトリ一覧を確認する（`ls app/src/lib/demo/color/` または `ls app/src/lib/demo/cg/`）。他方のカテゴリのディレクトリは候補に挙げない。
2. 図の内容に照らして妥当な配置先の候補を**4種類**挙げる。次の両方を必ず混ぜる。
   - **既存ディレクトリ**（同じカテゴリ配下で図の主題に近いもの。最低1つは含める）
   - **新規ディレクトリ名の案**（英字の kebab-case。最低1つは含める）

   カテゴリ配下に既存ディレクトリが1つも無い場合は、新規ディレクトリ名の案だけで4案を挙げる。
3. `AskUserQuestion` で4案を提示する（`header` は「配置先」など。`multiSelect` は `false`）。各選択肢の `label` にはディレクトリ名を、`description` には「既存／新規」の別と、そこに置く理由（何をまとめるディレクトリか）を書く。
4. **ユーザーの選択を待つ。** 回答が返るまでコンポーネントファイルは作成しない。
5. 選ばれたディレクトリに作成する。「Other」で4案にない名前を指定された場合はそれに従う。既存ディレクトリならそこに追加し、新規名ならディレクトリを新規作成する。

提示の例（色彩ページの「水晶体分光透過率のグラフ」の場合。いずれも `app/src/lib/demo/color/` 配下）:

| label | description |
| --- | --- |
| `aging-vision` | 既存 — 加齢による見え方の変化に関する図をまとめている |
| `visual-system` | 既存 — 眼の構造・視覚のしくみの図をまとめている |
| `eye-optics` | 新規 — 眼の光学特性（透過率・屈折など）でまとめる |
| `transmittance` | 新規 — 透過率のグラフを主題にまとめる |

### パターンA：`/svg-diagram-component <図の内容>`

- 配置先は「配置先のカテゴリ」でカテゴリを決めたうえで、「配置先ディレクトリの決定（省略時）」に従い、4案を提示してユーザーに選ばせる
- 選ばれた `app/src/lib/demo/color/[ディレクトリ名]/`（CGの図なら `app/src/lib/demo/cg/[ディレクトリ名]/`）配下にコンポーネントファイルを作成する
- 作成後、「完了報告」に従って import 文を提示する

### パターンB：`/svg-diagram-component [配置先ディレクトリ] <図の内容>`

- `<配置先ディレクトリ>` は「配置先のカテゴリ」で決めたカテゴリディレクトリ配下のパス
  - 例：色彩の図で `/svg-diagram-component [munsell] <図の内容>` であれば `app/src/lib/demo/color/munsell/` にコンポーネントを作成する
  - 例：CGの図で `/svg-diagram-component [lighting] <図の内容>` であれば `app/src/lib/demo/cg/lighting/` にコンポーネントを作成する
- ディレクトリが存在しなければ新規作成する
- 作成後、「完了報告」に従って import 文を提示する

### パターンC：`/svg-diagram-component [配置先ディレクトリ] <図の名前> <図の内容>`

ページ内のプレースホルダに対応する図を作るパターン。`<配置先ディレクトリ>` と `<図の内容>` はいずれも省略可能で、次のいずれの形でも指定できる。

- `/svg-diagram-component [配置先ディレクトリ] <図の名前> <図の内容>`
- `/svg-diagram-component [配置先ディレクトリ] <図の名前>`
- `/svg-diagram-component <図の名前> <図の内容>`
- `/svg-diagram-component <図の名前>`

`<図の名前>` は「パターンの判定」で検索し、ページ内のプレースホルダと逐語一致した範囲。それに続く残りが `<図の内容>`（描き方の指定）にあたる。

手順:

1. コンポーネントを作成する。
   - カテゴリはプレースホルダがヒットしたページのパスで決める（色彩ページなら `color/`、CGページなら `cg/`）。
   - `<配置先ディレクトリ>` が指定されていれば `app/src/lib/demo/<カテゴリ>/<配置先ディレクトリ>/` 配下に作成する（パターンBと同じ）。省略されている場合はパターンAと同様に「配置先ディレクトリの決定（省略時）」に従い、4案を提示してユーザーに選ばせてから作成する。
   - `<図の内容>` が指定されていればそれを図の仕様とする。省略されている場合は `<図の名前>`（＝プレースホルダの本文）自体を図の仕様として用いる。
2. コンポーネントを作成したら、対象ページに対して次を行う。
   1. `<script>` ブロックに、作成したコンポーネントの import 文を追加する（`SVGWrapper` が未 import であればあわせて追加する）
   2. import 文を追加したら、フロントマターに `visual: true` が無ければ追加する（図解コンポーネントを import したページは「図解を含むページ」であることを示すフラグ）
   3. 本文中のプレースホルダを、`<SVGWrapper>` で包んだコンポーネントの使用箇所に置き換える（例: `<SVGWrapper>\n  <EmergencyExitSign />\n</SVGWrapper>`）。`:::Todo` の場合は開始行から閉じの `:::` までのブロック全体を、HTMLコメント・地の文 `TODO：〜` の場合はその1行を置き換える。`TODO` の文字列がページに残らないようにする。

このパターンではページへの反映まで行うため、「完了報告」での import 文提示は不要。

## 完了報告

パターンA・パターンBでは、ページへの図の取り込みはユーザーが行うため、完了報告時に、作成したコンポーネントの import 文と、フロントマターへの `visual: true` 追加を次の形式で案内すること。

```
ページで使う場合は以下のようにimportしてください。

import EmergencyExitSign from "$lib/demo/color/color-visibility/EmergencyExitSign.svelte"

あわせて、そのページのフロントマターに visual: true が無ければ追加してください。
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
- グラフの曲線は例外で、**必ず `d3-shape` を使う**（→「グラフの曲線」）

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

#### タイプA（デフォルト）— `app/src/lib/demo/color/visual-effect-contrast/ContrastToneRelation.svelte` と同様

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

#### タイプB — `app/src/lib/demo/color/color-solid/ColorSolidSphere.svelte` の明度変化矢印と同様

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

スペクトル（可視光の波長分布）を表すグラデーションの描画を指示された場合は、`app/src/lib/demo/color/spectrum/SpectrumGradient.svelte` と同様のグラデーション（`gradientStops` の波長と色の対応）を採用する。

### グラフの軸スタイル

グラフ（横軸・縦軸を持つ図）を描画する場合、ユーザーからの指定が特になければ、横軸・縦軸・軸ラベルのスタイル（線の太さ、目盛り、フォントサイズ、ラベル位置など）は `app/src/lib/demo/color/spectral-reflectance/SpectralReflectanceGraph.svelte` と統一する。

### グラフの曲線

グラフのデータ点をつなぐ曲線は、**`d3-shape` の `line()` でパスを生成する。** `M`/`L` を並べた折れ線パスを自前で組み立てない（サンプリングを細かくして滑らかに見せる方法も採らない）。

- 補間方法は**原則 `curveBasis`**（B-spline・C² 連続）。既存の分光グラフ群（`visual-system/`・`xyz-color-system/`・`aging-vision/` 配下）がこれで統一されている。
- 実装は次の形にする。`line()` の戻り値は `string | null` なので `?? ""` でフォールバックする。

```ts
import { line, curveBasis } from "d3-shape"

const lineGen = line<Point>()
  .x((d) => xAt(d.nm))
  .y((d) => yAt(d.value))
  .curve(curveBasis)

const path = lineGen(points) ?? ""
```

#### 他の補間方法が推奨される場合

データの性質から `curveBasis` 以外が適切だと判断した場合は、**勝手に差し替えず、理由と候補をユーザーに提示して確認する。** `curveBasis` は制御点を通らないため、次のようなケースが典型的な検討対象になる。

- **各データ点を必ず通す必要がある**（実測値のプロットで、点とのズレが図の意味を損なう）→ `curveCatmullRom`・`curveNatural`
- **単調性を保ちオーバーシュートを避けたい**（単調増加・単調減少のデータ）→ `curveMonotoneX`
- **点と点の間を補間してはいけない**（離散データ・階段状の変化）→ `curveLinear`・`curveStep`

提示するときは、`curveBasis` でのズレの程度（線幅に対して何 px か、どの区間で最大になるか）まで見積もって添えると判断しやすい。確認の結果 `curveBasis` を維持する判断になることもあるため、**確認前に実装を差し替えてしまわないこと。**

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

- `app/src/lib/demo/color/visual-effect-contrast/ContrastToneRelation.svelte`
  - 定数の命名・グルーピング方法
  - タイプAの `marker` 要素の定義
  - TypeScriptの型定義の書き方

- `app/src/lib/demo/color/color-solid/ColorSolidSphere.svelte`
  - タイプBの `marker` 要素の定義
  - 動的な `viewBox` の算出方法

- `app/src/lib/demo/color/spectral-reflectance/SpectralReflectanceGraph.svelte`
  - グラフ（横軸・縦軸あり）のデフォルトスタイル
  - 軸・目盛り・軸ラベルの定数定義と配置方法
