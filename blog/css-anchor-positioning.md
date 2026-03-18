# CSS Anchor Positioning 活用ガイド — SVGとPopover APIを組み合わせた実装パターン

CSS Anchor Positioning は、ある要素を「アンカー（基準点）」として登録し、別の要素をそのアンカーの位置に追随させる仕組みです。ツールチップ・ポップオーバー・ドロップダウンといった「親要素に追従して表示される浮遊要素」の配置を、JavaScriptなしで宣言的に記述できます。

このドキュメントでは、PCCSカラーツールのSvelteコンポーネント2つを題材に、実際の使用箇所・構文の意味・実装の工夫をまとめます。

---

## 基本の仕組みを先に理解する

CSS Anchor Positioningを使うには、主に次の3ステップが必要です。

### Step 1 — アンカーを定義する（`anchor-name`）

```css
/* これがアンカーになる要素 */
.trigger {
  anchor-name: --my-anchor;
}
```

`anchor-name` はカスタムプロパティのような `--` 始まりの名前を取ります。この値が「アンカーのID」になります。

### Step 2 — 浮遊要素がアンカーを参照する（`position-anchor`）

```css
/* アンカーに追従する浮遊要素 */
.tooltip {
  position: fixed;        /* fixed または absolute が必要 */
  position-anchor: --my-anchor;
}
```

`position-anchor` でどのアンカーを使うかを宣言します。

### Step 3 — アンカーの辺を座標として使う（`anchor()` 関数 / `position-area`）

```css
.tooltip {
  /* アンカーの左辺を自分の right として使う → アンカーの左隣に表示 */
  right: anchor(left);
  /* アンカーの垂直中心に self を揃える */
  top: anchor(center);
}
```

または、方向をまとめて指定できる `position-area` を使う方法もあります。

```css
.tooltip {
  /* アンカーの下側に、左スパン方向で配置 */
  position-area: bottom span-left;
}
```

### フォールバック（`position-try-fallbacks` / `position-try`）

画面端で切れてしまうときに、自動で別の位置を試せます。

```css
.tooltip {
  /* 左右（インライン方向）を反転して試す */
  position-try-fallbacks: flip-inline;
  /* 上下・左右の両方を試す */
  position-try: flip-block flip-inline;
}
```

---

## 使用箇所 1: グレイ細分ポップオーバー（ToneSelector）

**ファイル**: `app/src/lib/components/patterns/ToneSelector.svelte`

### どんな場面で使っているか

PCCSのトーン選択UIには、グレイ系のセル（ltGy / mGy / dkGy）があります。これらは「グレイバケット」と呼ばれ、クリックすると「Gy-1.5」「Gy-2.5」などのより細かいグレイのサブトーンをポップオーバーで一覧表示します。

このポップオーバーを、対応するセルの**左側**に配置するためにCSS Anchor Positioningを使っています。

```
┌─────────────────────┐
│  ポップオーバー     │ ← アンカー（セル）の左隣に表示
│  ┌────┐             │
│  │Gy-1│     ┌─────┐ │
│  │Gy-2│ ←  │ltGy │ │ ← グレイバケットセル
│  │Gy-3│     └─────┘ │
│  └────┘             │
└─────────────────────┘
```

### 使われている構文の解説

#### インラインスタイルでアンカー名を設定

```svelte
<span
  class="cell-anchor"
  style="
    anchor-name: {getAnchorName(cell.key)};
  "
></span>
```

```svelte
<div
  class="gray-subtone-tooltip"
  style="position-anchor: {getAnchorName(cell.key)};"
>
```

`anchor-name` と `position-anchor` をインラインスタイルで設定しているのは、値が動的（各セルで異なる）だからです。

#### CSSでアンカーに対する位置を指定

```css
.gray-subtone-tooltip {
  /* Popover APIのデフォルトスタイルを無効化（後述） */
  inset: auto;
  margin: 0;

  position: fixed;

  /* デフォルト: アンカーの左隣に配置 */
  right: anchor(left);    /* 自分の右辺 = アンカーの左辺 */
  margin-right: 8px;      /* 8pxの余白を加える */
  top: anchor(center);    /* アンカーの垂直中心に合わせる */
  translate: 0 -50%;      /* 自分自身を上に半分ずらして垂直センタリング */

  /* 左に収まらない場合は右側を試す */
  position-try-fallbacks: flip-inline;
  /* 最もスペースが広い方を優先 */
  position-try-order: most-width;
}
```

**`anchor(left)` の読み方**: 「アンカー要素の左辺のX座標」という意味です。`right: anchor(left)` は「自分の右端をアンカーの左辺に揃える」= アンカーの左側に自分を置く、という配置になります。

**`position-try-fallbacks: flip-inline`**: デフォルトが左側表示のとき、左に収まらなければ右側に反転して試みます。`flip-inline` は水平方向（インライン方向）の反転です。

**`position-try-order: most-width`**: 複数のフォールバック候補のうち、横幅が最も取れる位置を優先します。

### 実装上の工夫

#### 工夫1: SVGの `<g>` 要素は anchor-name が使えない

このコンポーネントのトーンセルはSVGの `<g>` 要素として描かれています。しかし **SVG要素はCSSのレイアウトシステムに参加しないため、`anchor-name` を設定しても機能しません**。

そこで、SVG上の各セルと同じ位置に**不可視のHTMLスパン**を絶対配置で重ね、そちらにアンカーを設定しています。

```svelte
<!-- SVG g は anchor-name 非対応のため、
     グレイバケットセルに重なる不可視HTMLアンカーを絶対配置で設置 -->
{#each CELLS as cell (cell.key)}
  {#if GRAY_BUCKET_KEYS.has(cell.key)}
    <span
      class="cell-anchor"
      style="
        left: {((cell.cx - RECT_W / 2) / SVG_W) * 100}%;
        top: {((cell.cy - RECT_H / 2) / SVG_H) * 100}%;
        width: {(RECT_W / SVG_W) * 100}%;
        height: {(RECT_H / SVG_H) * 100}%;
        anchor-name: {getAnchorName(cell.key)};
      "
    ></span>
  {/if}
{/each}
```

```css
.cell-anchor {
  position: absolute;
  pointer-events: none; /* クリックイベントを透過させる */
}
```

SVGのviewBox座標（ピクセル単位）を、ラッパー要素に対するパーセンテージに変換して配置することで、SVGがレスポンシブにスケールしてもアンカーの位置がずれないようにしています。

変換式は `(SVG座標 / SVGの幅または高さ) × 100` です。

#### 工夫2: Popover APIのデフォルトスタイルをリセットする

`popover="auto"` 属性を持つ要素は、ブラウザが自動的に以下のスタイルを適用します。

```css
/* ブラウザのデフォルト（概念的なイメージ） */
[popover] {
  inset: 0;
  margin: auto;
}
```

`inset: 0; margin: auto` は要素をビューポート中央に配置するための設定です。これが残っていると、`anchor()` による位置指定が無効化されてしまいます。

そのため明示的にリセットが必要です。

```css
.gray-subtone-tooltip {
  inset: auto;  /* inset: 0 を上書き */
  margin: 0;    /* margin: auto を上書き */
}
```

#### 工夫3: 複数インスタンス時のアンカー名の衝突を防ぐ

同一ページにToneSelectorコンポーネントが複数配置される場合、アンカー名が衝突すると誤ったセルに追従してしまいます。

そこで、コンポーネントのマウント時にランダムなIDを生成し、アンカー名に含めています。

```typescript
// インスタンスごとにユニークなIDを生成（複数配置時のID衝突を防ぐ）
const instanceId = Math.random().toString(36).slice(2, 8)

// CSS Anchor Positioning 用のアンカー名を生成
function getAnchorName(key: string): string {
  return `--tone-selector-${instanceId}-${key}`
}
```

例: `--tone-selector-a3f9d2-ltGy`、`--tone-selector-b7k1e9-ltGy` のように、インスタンスごとに異なる名前になります。

---

## 使用箇所 2: トーン情報ツールチップ（ToneImageDiagram）

**ファイル**: `app/src/lib/components/index/ToneImageDiagram.svelte`

### どんな場面で使っているか

PCCSのトーン概念図（彩度・明度の2軸上にトーンセルを並べた図）で、セルをクリックするとそのトーンの詳細情報（英語名・イメージワード・カラースウォッチ）がツールチップとして表示されます。

ツールチップはクリックしたセルの**下側**に配置され、スペースが足りなければ自動的に反転します。

### 使われている構文の解説

#### `position-area` でまとめて方向指定

```css
.tone-tooltip {
  position: fixed;
  margin-block: 8px;

  /* アンカーの下側、左スパン方向で配置 */
  position-area: bottom span-left;

  /* 下に収まらなければ上下・左右を試す */
  position-try: flip-block flip-inline;
}
```

**`position-area: bottom span-left`** は2つの部分からなります。

- `bottom`: ツールチップをアンカーの**下側**に配置する
- `span-left`: ツールチップの右端をアンカーの右端に揃え、左方向に広げる

文字通り「アンカーの下に、左へスパンする形で」配置するイメージです。

```
             ┌─────┐
             │ セル │ ← アンカー
             └─────┘
┌────────────────────┐
│   ツールチップ      │ ← bottom span-left
│                    │
└────────────────────┘
```

**`position-try: flip-block flip-inline`** は複数の反転パターンをまとめて指定します。

- `flip-block`: ブロック方向（垂直）の反転 → 下に収まらなければ上へ
- `flip-inline`: インライン方向（水平）の反転 → 左に収まらなければ右へ

ブラウザは `flip-block`、`flip-inline`、`flip-block flip-inline`（両方反転）の順で試み、収まる位置を採用します。

#### アクティブなセルだけにアンカーを設置する

ToneSelectorがグレイの3セル全てにアンカーを常時配置していたのと異なり、ToneImageDiagramはクリックされた（アクティブな）セルにのみアンカーを設置します。

```svelte
{#if activeCell}
  <span
    class="cell-anchor"
    style="
      left: {anchorLeft(activeCell)}%;
      top: {anchorTop(activeCell)}%;
      width: {anchorW(activeCell)}%;
      height: {anchorH(activeCell)}%;
      anchor-name: {ANCHOR_NAME};
    "
  ></span>
{/if}
```

アンカー名はインスタンスにつき1つで固定（`ANCHOR_NAME`）。セルが切り替わるたびにスパンの位置が変わり、ツールチップは常に最後にアクティブになったセルに追従します。

#### SVG座標からパーセンテージへの変換

セルの形状によって（円形・矩形で）左上座標と幅高さの計算が異なります。ヘルパー関数で吸収しています。

```typescript
function anchorLeft(cell: ToneCell): number {
  // 円: 中心X - 半径、矩形: 左辺 = cx - 幅/2
  const x = cell.shape === "circle" ? cell.cx - CELL_R : cell.cx - RECT_W / 2
  return (x / SVG_W) * 100  // % に変換
}

function anchorW(cell: ToneCell): number {
  // 円: 直径、矩形: 幅
  return ((cell.shape === "circle" ? 2 * CELL_R : RECT_W) / SVG_W) * 100
}
```

### 実装上の工夫

#### 工夫1: ツールチップをラッパーの外に配置する

```svelte
<div class="diagram-wrapper">
  <svg>...</svg>
  <!-- アンカースパンはラッパー内 -->
  {#if activeCell}
    <span class="cell-anchor" ...></span>
  {/if}
</div>

<!-- ツールチップはラッパーの外！ -->
<div class="tone-tooltip" popover="auto" ...>
```

ツールチップは `diagram-wrapper` の**外側**に配置されています。`position: fixed` は最も近い [`transform` などが設定された祖先要素](https://developer.mozilla.org/docs/Web/CSS/position#fixed) の内側に閉じ込められてしまいます。ラッパー内に配置するとスクロールや `overflow: hidden` の影響を受ける可能性があるため、DOM上のトップレベルに近い位置に置くのが安全です。

一方、アンカースパン（`.cell-anchor`）はラッパー内に配置する必要があります。`position: absolute` でラッパー相対に配置するためです。`position: fixed` のツールチップも `anchor-name` を通じてアンカーの位置を参照できるため、DOMの親子関係は問いません。

#### 工夫2: ToneSelectorとの共通パターン

ToneSelectorと全く同じ設計思想が踏襲されています。

| | ToneSelector | ToneImageDiagram |
|---|---|---|
| アンカーの対象 | グレイの3バケットセル（常時） | アクティブなセル（1つ） |
| アンカー数 | インスタンスあたり最大3つ | インスタンスあたり1つ |
| デフォルト表示位置 | アンカーの左側 | アンカーの下側 |
| フォールバック | `flip-inline`（左右反転） | `flip-block flip-inline`（上下・左右反転） |
| Popover API | `popover="auto"` | `popover="auto"` |

---

## まとめ：このコードベースで確立されたパターン

### SVGとCSS Anchor Positioningを組み合わせる手順

```
1. SVG要素（<g>/<circle>/<rect>）にはanchor-nameが使えない
   ↓
2. SVGのviewBox座標をパーセンテージに変換
   x% = (SVG_X / SVG_W) × 100
   y% = (SVG_Y / SVG_H) × 100
   ↓
3. position:absolute の不可視スパンをラッパー内に絶対配置
   .cell-anchor { position: absolute; pointer-events: none; }
   ↓
4. そのスパンにanchor-nameをインラインスタイルで設定
   style="anchor-name: --my-anchor;"
   ↓
5. 浮遊要素にposition-anchorを設定してanchor()やposition-areaで配置
```

### Popover API と組み合わせる際の注意点

- ブラウザは `[popover]` 要素に `inset: 0; margin: auto` を自動付与する
- これを上書きしないと CSS Anchor Positioning が無効化される
- **必ず `inset: auto; margin: 0` でリセットする**
- `position: fixed` を明示的に指定する

### アンカー名の衝突を防ぐ

- 同一ページに同じコンポーネントが複数存在する場合、固定のアンカー名は衝突する
- `Math.random().toString(36).slice(2, 8)` でインスタンスごとのユニークIDを生成
- `--component-name-${instanceId}-${cellKey}` のパターンでアンカー名を構成する
