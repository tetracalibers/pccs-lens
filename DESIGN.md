# DESIGN.md — Color Prism

## 設計思想

本サイト（Color Prism）は「色彩そのものを主役にした学習サイト」である。UI は色の理解を邪魔せず、しかし無味乾燥にもならない——モダン CSS を積極的に使い、**親しみやすさと可読性を両立**させることを目指す。

具体的には次の性格を持つ。

- **色で語る:** ブランドの虹色パレット、PCCS/JIS の色見本、パステル・ペン色など、色そのものが最大の装飾である。UI クロムは控えめにして、色見本を引き立てる。
- **やわらかい輪郭:** 角丸（`border-radius`）を標準採用する。カードは `6px`、小要素は `4px`／`0.25rem`、円形要素は `50%`。角の立った直線的デザインではなく、丸みで親しみやすさを出す。
- **奥行きは影より色で:** `box-shadow` は抑制的に使い（カードのホバー浮き上がりと発光リングのみ）、基本の階層は `light-dark()` の色ペアと `1px` ボーダーで表現する。
- **日本語の読みやすさ優先:** 本文は行間を広く（`line-height: 1.9`）、サイズはやや小さめ（`0.9rem`）のコンパクトな組み。
- **モダン CSS を前提にする:** `light-dark()`、相対色構文（`oklch(from …)` / `hsl(from …)` / `rgb(from …)`）、`color-mix()`、コンテナクエリ、Popover API + CSS Anchor Positioning、システムカラー（`Highlight` / `Canvas`）を積極的に採用する。

**迷ったときの判断基準:**

- 新しい色が必要になったら、まず `color.css` の既存トークンか、既存色からの相対色（`oklch(from …)` / `color-mix()`）で導出できないか考える。無関係な新規 HEX を足さない。
- テキスト色に迷ったら `var(--color-heading)`（見出し）か `var(--color-body)`（本文）を **直接** 参照する。`light-dark(#…, #…)` をコンポーネント側で再定義しない。
- 角丸にするか迷ったら、角丸にする（このサイトの標準）。ただし値は既存スケール（`4px` / `6px` / `0.25rem` / `50%`）から選ぶ。
- 影を足したくなったら、まず色ペア＋ボーダーで階層を作れないか考える。影はホバーの浮き上がりなど「動き」に伴うときだけ。
- フォーカス表現を消したくなったら、必ず `Highlight` システムカラーなどで代替リングを用意する（`outline: none` を裸で置かない）。

---

## 本ドキュメントの位置づけ

本ドキュメントは **既存の実装（`app/` 配下）から抽出した** デザインシステムの記述である。Figma などの外部デザイン仕様は存在せず、**コードが正**である。新しいコンポーネントやページを生成・修正する際は、本ドキュメントに記された既存の語彙・パターンに準拠すること。

Color Prism のデザインシステムは、色とフォントファミリーは CSS Variables でトークン化されている一方、**サイズ・余白はトークン化されておらず** `rem` の直値で運用されている。本ドキュメントは、その「実際に使われている非公式スケール」も含めて記述する。生成コードは新しいスケールを発明するのではなく、下記の実測値の範囲に収めること。

---

## 基本原則

- **色トークンの徹底:** テキスト色・背景色は `var(--color-*)` 経由で指定する。特に本文・見出しは `var(--color-body)` / `var(--color-heading)` を直接参照し、`light-dark()` をハードコードで再定義しない。
- **フォントトークンの徹底:** `font-family` は `var(--font-*)`（`routes/+layout.svelte` の `:global(body)` で定義）を使う。数値・PCCS 表記・HEX 表示は一貫して `var(--font-mono)`。
- **相対色構文の活用:** ホバーの暗色化やボーダー色は、対象色からの相対導出（`oklch(from … calc(l * 0.75) c h)`、`rgb(from … / 20%)`、`color-mix()`）を優先する。
- **角丸は標準、`border-radius: 0` は使わない:** 既存スケール（`4px` / `6px` / `0.25rem` / `50%` / ピルは `999px`）から選ぶ。
- **セクション区切りは余白で:** `<hr>` や重い罫線ではなく、余白と見出しの上下マージン差で分離する（見出しは「上に大きく・下に小さく」）。
- **フォーカスは可視化する:** `outline: none` の後には `:focus-visible` などで `Highlight` システムカラーの代替リングを必ず用意する。

---

## カラー

すべてのテーマ色は `app/src/lib/styles/color.css`（`:root` の単一ブロック）に集約され、`routes/+layout.svelte:9` で一度だけグローバル import される。ドメインの色見本データ（PCCS/JIS/Munsell）は CSS ではなく `app/src/lib/data/*.json` にある（後述）。

### テーマの基調色（プリミティブ）

light/dark それぞれの「種」となる値。見出し色を種に、本文色を相対色で導出している。

| CSS Variable            | 値                                                             | 備考                                             |
| :---------------------- | :------------------------------------------------------------ | :----------------------------------------------- |
| `--color-heading--light` | `#1a1a1a`                                                     | 見出しテキスト（ライト）。純黒ではない           |
| `--color-body--light`    | `oklch(from var(--color-heading--light) calc(l + 0.22) 0.04 235)` | 本文（ライト）。見出しから明度 +0.22・彩度 0.04・色相 235 で導出した青みグレー |
| `--color-heading--dark`  | `#eeeef8`                                                     | 見出しテキスト（ダーク）。かすかに紫を帯びた白   |
| `--color-body--dark`     | `oklch(from var(--color-heading--dark) calc(l - 0.15) calc(c * 0.5) h)` | 本文（ダーク）。見出しから明度 −0.15・彩度 ×0.5 で導出（見出しより一段沈む） |
| `--color-bg--light`      | `#ffffff`                                                     | ページ背景（ライト）                             |
| `--color-bg--dark`       | `#0c0c14`                                                     | ページ背景（ダーク）。かすかに青い黒             |

### セマンティックエイリアス（テーマ追従）

コンポーネントのスタイル指定では **こちらを直接** 使う。`light-dark()` によりテーマで自動的に切り替わる。

| CSS Variable      | 参照                                                          | 用途                                       |
| :---------------- | :----------------------------------------------------------- | :----------------------------------------- |
| `--color-bg`      | `light-dark(var(--color-bg--light), var(--color-bg--dark))`  | ページ背景（主に `body` で一度指定）       |
| `--color-heading` | `light-dark(var(--color-heading--light), var(--color-heading--dark))` | 見出しテキスト                    |
| `--color-body`    | `light-dark(var(--color-body--light), var(--color-body--dark))` | 本文テキスト（最も多用されるトークン） |
| `--color-anki`    | `light-dark(#6b23a8, #e8c8ff)`                              | 暗記モードのアクセント（ライト=紫／ダーク=淡いラベンダー） |

> **テーマ追従するのはこの 4 トークンのみ**（`--color-bg` / `--color-heading` / `--color-body` / `--color-anki`）。以下のペン色・パステル・グレード色・カテゴリ色はテーマ非依存（固定値）である。

### キャンバスペン色（プリミティブ・固定値）

図解や手書き風の描画に使う基準色。

| CSS Variable        | 値        |     | CSS Variable          | 値        |
| :------------------ | :-------- | --- | :-------------------- | :-------- |
| `--canvas-pen-red`  | `#cc3333` |     | `--canvas-pen-water`  | `#24b9ff` |
| `--canvas-pen-pink` | `#eb539f` |     | `--canvas-pen-orange` | `#ef8c00` |
| `--canvas-pen-green`| `#339944` |     | `--canvas-pen-yellow` | `#f6ce46` |
| `--canvas-pen-blue` | `#3366dd` |     | `--canvas-pen-gray`   | `#bfbfbf` |

### パステル色（ペン色からの相対導出）

各ペン色を `hsl(from …)` で高彩度・高明度化した派生色。`--pastel-gray` は存在しない。

| CSS Variable     | 導出                                                          |
| :--------------- | :---------------------------------------------------------- |
| `--pastel-red`   | `hsl(from var(--canvas-pen-red) h calc(s * 1.4) calc(l * 1.3))`  |
| `--pastel-pink`  | `hsl(from var(--canvas-pen-pink) h calc(s * 1.4) calc(l * 1.4))` |
| `--pastel-green` | `hsl(from var(--canvas-pen-green) h calc(s * 1.5) calc(l * 2.1))` |
| `--pastel-blue`  | `hsl(from var(--canvas-pen-blue) h calc(s * 3.5) calc(l * 1.7))` |
| `--pastel-water` | `hsl(from var(--canvas-pen-water) h calc(s * 1.1) calc(l * 1.45))` |
| `--pastel-orange`| `hsl(from var(--canvas-pen-orange) h calc(s * 1.5) calc(l * 1.65))` |
| `--pastel-yellow`| `hsl(from var(--canvas-pen-yellow) h calc(s * 1.1) calc(l * 1.2))` |

### グレード色・カテゴリ色

| CSS Variable              | 値                     | 用途                                   |
| :------------------------ | :--------------------- | :------------------------------------- |
| `--color-grade-1`         | `#fde68a`              | 検定グレード 1（アンバー）             |
| `--color-grade-2`         | `#6ee7b7`              | 検定グレード 2（グリーン）             |
| `--color-grade-3`         | `#c4b5fd`              | 検定グレード 3（バイオレット）         |
| `--color-grade-uc`        | `#93c5fd`              | 検定グレード UC（ブルー）              |
| `--color-cg`              | `var(--pastel-blue)`   | 「CG」カテゴリのアクセント             |
| `--color-image-processing`| `var(--pastel-green)`  | 「画像処理」カテゴリのアクセント       |

### 局所トークン（グローバル未定義）

`--color-border`（頻出値 `light-dark(#e0e0e0, #2e2e3e)`）や `--color-text` は **グローバルには定義されておらず**、各ページ／コンポーネントの root で局所的に定義され、`var(--color-border, #ccc)` のようにフォールバック付きで参照されることが多い。新規コンポーネントでボーダー色が要るときは、この頻出値に揃えるか、局所トークンを立てる。

### テーマ（ライト/ダーク）の仕組み

1. **共有状態:** `app/src/lib/state/lightMode.svelte.ts` が Svelte 5 rune の `$state({ isLightMode: false })` をエクスポートする。
2. **初期値はシステム設定に追従:** `SwitchLightDark.svelte` の `$effect` が `matchMedia("(prefers-color-scheme: light)")` を読み、マウント時に反映＋ `change` を購読する。
3. **状態 → `body` クラス:** もう一つの `$effect` が `document.body` に `light` / `dark` クラスを付与する。
4. **`color-scheme` の強制がキモ:** `:root { color-scheme: light dark }`（`+layout.svelte:52`）を起点に、`body.light { color-scheme: light }` / `body.dark { color-scheme: dark }`（`+layout.svelte:89-95`）でスキームを固定する。これによりアプリ全域の `light-dark()` が一斉に再解決される。`<meta name="color-scheme" content="light dark">` も併記（`+layout.svelte:30`）。
5. **切替アニメ:** `body` に `transition: background 0.4s, color 0.4s`（`+layout.svelte:84-87`）。
6. **永続化はしない:** localStorage 等への保存はなく、リロードするとシステム設定に戻る（セッション内の一時切替）。
7. **JS 側で色が要る場合:** CSS の `light-dark()` が届かない Canvas/SVG 描画では、`lightModeState.isLightMode` を直接読んで色を出し分ける（例 `lib/components/patterns/ToneSelector.svelte`、`lib/demo/hue-tone-diff/ToneBasedPalettePreviewWithDiffMap.svelte`）。

### カラーの規約

- 本文・見出しのテキスト色は `var(--color-body)` / `var(--color-heading)` を **直接** 参照する。コンポーネント側で `light-dark(#…, #…)` を再定義しない。
- ホバー時の暗色化・半透明化は相対色で導出する（`oklch(from currentColor calc(l * 0.75) c h)`、`rgb(from … / 20%)`）。
- テーマ非依存の装飾（図解・ブランド虹色グラデ）はハードコード HEX で構わない。実際、ハードコード HEX はデータビジュアライゼーション系（`lib/demo/`、`lib/components/` の図解）に集中しており、これは正常。**プロース（本文・レイアウト）にはハードコード色を持ち込まない。**

### ドメインの色見本データ

UI テーマ色は `lib/styles/color.css`、**ドメインの色見本データ（PCCS/JIS/Munsell）は `lib/data/*.json`** に分離されている。

- PCCS: `lib/data/pccs_*.json` を `lib/data/pccs.ts` / `pccs-tone.ts` が組み立て、`PCCS_V24` / `PCCS_ALL` / `PCCS_HEX_MAP` 等として公開。
- JIS 慣用色名: `lib/data/jis_colors.json` / `jis_color_family.json` を `lib/data/jis-colors.ts` が読み込む。
- Munsell・色計算: `lib/data/munsell_hue.json`、色数理は `lib/color/`、配色技法ロジックは `lib/patterns/`。

---

## タイポグラフィ

### フォントファミリートークン

すべての `--font-*` は `routes/+layout.svelte:56-70` の `:global(body)` に定義される。命名は 2 段構成——`*-base` が「フォント名のみ」（合成スタックで再利用）、非 `base` が「フォールバック付きスタック」。

| Token                   | 値                                          | 主な用途                                     |
| :---------------------- | :------------------------------------------ | :------------------------------------------- |
| `--font-ja-base`        | `"Zen Kaku Gothic New"`                     | 日本語（名前のみ）                           |
| `--font-ja`             | `var(--font-ja-base), sans-serif`           | 日本語スタック                               |
| `--font-en-base`        | `"SUSE Mono"`                               | 欧文（名前のみ）                             |
| `--font-en`             | `var(--font-en-base), sans-serif`           | 欧文スタック                                 |
| `--font-mono-base`      | `"Reddit Mono"`                             | 等幅（名前のみ）                             |
| `--font-mono`           | `var(--font-mono-base), monospace`          | コード・数値・PCCS 表記・HEX 表示（最多用）  |
| `--font-mark`           | `var(--font-mono-base), var(--font-ja-base)`| マーク付き強調テキスト（等幅欧文＋日本語）   |
| `--font-fancy`          | `"Delius", cursive`                         | 手書き風アクセント                           |
| `--font-classic`        | `"Rakkas", serif`                           | 図解 SVG の装飾見出し                        |
| `--font-round`          | `"Kiwi Maru", serif`                        | 丸みラベル（色立体・JIS 見本）               |
| `--font-anki-title`     | `"Flow Rounded", system-ui`                 | 暗記モードの見出し                           |
| `--font-anki-round`     | `"Flow Circular", system-ui`                | 暗記モードの伏字風テキスト                   |
| `--font-math-base`      | `"Marmelad"`                                | 数式（名前のみ）                             |
| `--font-math`           | `var(--font-math-base), sans-serif`         | 数式スタック                                 |
| `--font-bold-text-demo` | `"Sigmar One", sans-serif`                  | 縁取り文字デモ用の極太ディスプレイ           |

- **body 既定:** `font-family: var(--font-en-base), var(--font-ja-base), sans-serif`（`+layout.svelte:72`）。欧文グリフは SUSE Mono、日本語はブラウザのグリフフォールバックで Zen Kaku Gothic New に落ちる。
- **`font-synthesis-weight: none`**（`+layout.svelte:73`）。合成ボールドを禁止し、実ウェイトのみ使う。
- 合成トークン `--font-en` / `--font-math` は定義のみで直接参照はほぼ無く、実コードは `*-base` を独自スタックに組み込む（例: コードブロック `var(--font-mono-base), var(--font-ja-base)`、KaTeX `var(--font-math-base), var(--font-ja-base), KaTeX_Main`）。

### 読み込みウェブフォント

`<svelte:head>` の Google Fonts 2 リンクで読み込む（`+layout.svelte:34-40`、`display=swap`、preconnect 付き）。

- シート 1: Sigmar One / Kiwi Maru(500) / Flow Circular / Flow Rounded / Rakkas / Delius / Reddit Mono(400..700 可変) / SUSE Mono(400;500) / Zen Kaku Gothic New(400;500)
- シート 2: Marmelad

ウェイトは各基調フォントで 400/500 のみ（Reddit Mono だけ 400–700 可変）に絞っており、`font-synthesis-weight: none` と整合する。

### フォントサイズ（非トークン・`rem` 直値）

**グローバルなサイズトークンは存在しない。** サイズはコンポーネントごとに `rem` の直値で指定する（`clamp()` によるフルイドタイポや、`cqi`/`vw` によるフォントサイズは不使用）。本文はやや小さめ・行間広めのコンパクトな組み。

**見出しランプ（`lib/components/HeadingN.svelte`）:**

| 要素 | font-size | font-weight | line-height | margin（上 右下 下）      | 備考                         |
| :--- | :-------- | :---------- | :---------- | :------------------------ | :--------------------------- |
| H1   | `2.2rem`（compact 時 `2rem`） | `900` | `1.2` | `3.5rem 0 1.25rem` | アイコン付き。`:first-of-type` は上マージン 0 |
| H2   | `1.6rem`  | `700`       | `1.3`       | `2rem 0 0.75rem`          | `scroll-margin-top: 120px`   |
| H3   | `1.2rem`  | `700`       | `1.3`       | `1.6rem 0 0.45rem`        | —                            |
| H4   | `0.95rem` | `600`       | `1.3`       | `1.2rem 0 0.3rem`         | —                            |

見出しは一貫して「上マージン大・下マージン小」の非対称リズムで、直後の本文に寄せる。

**本文・その他の代表値:**

| 役割             | font-size    | line-height | 参照                                  |
| :--------------- | :----------- | :---------- | :------------------------------------ |
| 本文段落         | `0.9rem`     | `1.9`       | `lib/layouts/guide-content.svelte`    |
| コードブロック   | `0.9rem`     | `1.5`       | 同上                                  |
| 図キャプション   | `0.8rem`     | —           | 同上                                  |
| サイト名ロゴ     | `1rem`       | `1`         | `SiteHeader.svelte`（`font-weight: 900`, `letter-spacing: -0.03em`） |
| ナビ・フッター   | `0.8–0.82rem`| `1.4–1.5`   | `SiteHeader.svelte` / `SiteFooter.svelte` |
| 極小ラベル（大文字アイブロウ） | `0.62rem` | — | `SiteHeader.svelte`（`font-weight: 800`, `letter-spacing: 0.12em`, `text-transform: uppercase`） |

最頻サイズは `0.9rem` / `0.75rem` / `0.8rem` で、本文帯は `1rem` を下回る。**新規要素はこの帯（キャプション `0.75–0.8rem`、本文 `0.9rem`、小見出し `0.95–1.2rem`）に収める。**

### その他のタイポ属性

- **line-height:** 見出しは `1.2–1.3`、本文は `1.9`（日本語可読性のため広め）、UI/コードは `1`〜`1.5`。
- **font-weight:** 離散値のみ（`600` / `700` / `800` / `900`）。可変ウェイト補間はしない。
- **letter-spacing:** 大文字アイブロウ・コールアウト見出しに正のトラッキング（`0.1em`〜`0.12em`）、大きなディスプレイ文字に微小な負トラッキング（`-0.02em`〜`-0.03em`）。本文には掛けない。
- **OpenType 機能・高度な折り返し:** `font-feature-settings` / `palt` / `text-spacing-trim` / `text-wrap` は基本 **不使用**。日本語の折り返しは一部で `word-break: auto-phrase` を使う（フッター、CG 索引カード）。

---

## スペーシング

**スペーシングのトークンスケール（`--space-*`）は存在しない。** 余白は `rem` の直値が支配的で、`px` は 8px 未満の微小余白に限定される（分布はおよそ `rem` : `px` = 287 : 62）。生成コードは新しい刻みを作らず、下記の非公式スケールに揃える。

**要素間ギャップ（`gap` / `margin` / `padding`）の頻出値:**

| 帯       | 値                                   | 用途                                   |
| :------- | :----------------------------------- | :------------------------------------- |
| 標準     | `1rem`（最多）、`0.75rem`、`0.5rem`  | 要素間・パディングの基本               |
| やや大   | `1.25rem`、`1.5rem`、`2rem`、`2.5rem`| セクション内・ブロック間               |
| 微小     | `4px`、`2px`、`5px`、`6px`、`8px`    | タグ間・アイコン間などの細かい隙間     |

**コンテンツの縦リズム（`concept` / `guide-content` / `guide-map` 共通）:**

- 段落: `margin: 0.75rem 0; font-size: 0.9rem; line-height: 1.9`
- 見出しの上下マージンは前掲の見出しランプに従う（上大・下小）。
- 図・画像: `margin-block: 1rem–1.5rem` を `margin-inline: auto` で中央寄せ。`pre` は `padding: 1rem`。

セクション区切りは罫線ではなく、この見出しマージン差と余白で表現する。

---

## レイアウト

### ページシェル

`<body>` 直下に 3 要素が並ぶフレックスカラム（スティッキーフッター構成）。

```
SiteHeader        （position: sticky; top: 0; z-index: 100）
.container        （children = 各 layout コンポーネントの <main>）
SiteFooter
```

- **`body`（`+layout.svelte:55-87`）:** `display: flex; flex-direction: column; min-height: 100dvh; margin: 0; background: var(--color-bg)`。フッターは `.container` の `flex: 1 0 auto` により最下部へ押し下げられる（`position: fixed` は使わない）。
- **`.container`（`+layout.svelte:98-105`）:** `flex: 1 0 auto; width: 100%; box-sizing: border-box; margin: 3rem auto; padding: 1.5rem 1.5rem 0; container-type: inline-size`。**`max-width` は持たない**——幅の上限は内側の各 `<main>` に委ねる。`container-type: inline-size` により、配下の `cqw`/`cqh` 単位の基準コンテキストを確立する。

### 幅の体系

| 用途                       | 幅       | 参照                                                      |
| :------------------------- | :------- | :------------------------------------------------------- |
| 記事・ガイドの読み幅（正） | `680px`  | `lib/layouts/*` の `main`（`concept` / `guide-content` / `guide-map`）、`SiteFooter` のページ送りも同幅 |
| 索引・ランディングのラッパ | `720px`  | `routes/+page.svelte`、`routes/cg/+page.svelte`、`routes/patterns/**`、`routes/jis-color-map/+page.svelte` |
| ヘッダー内枠（シェル）     | `960px`  | `SiteHeader.svelte` の `.header-inner`（`padding: 0.5rem 1.25rem; min-height: 56px`）|

**記事本文の読み幅は `680px` が正。** サイドバーやマルチカラムは使わず、すべて 1 カラムを中央寄せ（`margin: 0 auto`）する。

### レイアウトコンポーネント（`lib/layouts/`）

いずれも `680px` の単一読み幅カラムを中央寄せする。サイドバー・本文グリッドは持たない。

| コンポーネント          | ページ種別                             | 幅・構成                                          |
| :---------------------- | :------------------------------------- | :----------------------------------------------- |
| `guide-content.svelte`  | 記事本文（色の理論／活用分野／CG）     | `main` を `max-width: 680px` で中央寄せ。`.page-meta` は flex（`gap: 1rem`）、豊かな本文リズムを持つ |
| `guide-map.svelte`      | セクション一覧／マップ                 | `main` `680px`、内側リスト `632px`（`calc(680px - 1.5rem * 2)`）。`ul` は縦フレックス |
| `concept.svelte`        | 「このサイトの歩き方」                 | `main` `680px` 中央寄せ。段落 `0.9rem / 1.9` |
| `cg-guide.svelte`       | CG・画像処理の索引                     | `GuideMap` に委譲（独自 CSS なし）               |

### グリッドの使いどころ

本文フローにグリッドは使わない。グリッドはシェルのフッターページ送り（`SiteFooter`：`grid-template-columns: minmax(0, 33cqw) 1fr minmax(0, 33cqw); max-width: 680px; margin-inline: auto`）と、個別の図解・カード一覧に限られる。

---

## レスポンシブ

**戦略は「条件分岐は `@media`、フルイドなサイズ調整は `container-type` + `cqw/cqh`」の二本立て。** 条件付き `@container` クエリは **一切使っていない**（`container-type` は宣言するが、`cq` 単位はサイズ計算のためだけに使う）。

- **コンテナ文脈:** `container-type: inline-size` を `.container`（シェル）と `.site-footer` に設定。`lib/demo/PlaybackStage.svelte` のみ `container-type: size`。
- **フルイドサイズ（`cq` 単位）:** `90cqw` / `95cqw` / `min(800px, 95cqw)`（JIS カラーマップ等）、`70cqh` / `80cqh`（アニメ図解の高さ）、フッターグリッドの `33cqw`。
- **ブレークポイントはすべて `@media`。** 実際に使われている閾値:

| 閾値      | 主な用途                                                  |
| :-------- | :------------------------------------------------------- |
| **640px**（主） | ヘッダーのワイドナビ↔ドロップダウン切替（`min-width`）、および一部図解の縮約（`max-width`）|
| 480px     | トップページのブロック、`GeoPatternSection`             |
| 540px     | トップページ                                            |
| 430px     | CG 索引カード                                            |
| 760px     | JIS 色詳細セクション                                     |
| 800px     | JIS 色比較セクション                                     |

グローバルに効く主ブレークポイントは **640px**（ヘッダー）。その他はコンポーネント局所。テーマ・モーションは `prefers-*` メディアクエリではなく `light-dark()` / `color-scheme` で扱うのが基本。

---

## コンポーネント

汎用 `Button` のような共有コンポーネントは（`CopyButton` を除き）存在せず、**各コンポーネント／ページが個別にスタイリング** する。以下は実コードから抽出した共通の視覚語彙。新規コンポーネントはこれに準拠する。

### 横断コンベンション（定量）

**border-radius —— 角丸が標準。`border-radius: 0` は皆無。**

| 値               | 主な用途                       |
| :--------------- | :----------------------------- |
| `50%`            | ドット・ノブ・円形             |
| `6px`            | カード                         |
| `4px` / `0.25rem`| 小ボタン・チップ・ドロップダウンリンク |
| `8px` / `0.5rem` | 大きめカード・パネル・プレビュー |
| `20px`           | ピル型タグ                     |
| `999px`          | トグルなどの完全ピル           |

**border —— `1px solid` ＋ `light-dark()` 色ペアが定型。** 最頻色は `light-dark(#e0e0e0, #2e2e3e)`。トークン経由なら `1px solid var(--color-border, #ccc)`。選択強調・ボタン枠に `1.5px`/`2px`。装飾なしボタンは `border: none`。

**box-shadow —— 抑制的。** 用途は「カードのホバー浮き上がり」と「発光リング」に限る。定番はカードホバーの `0 4px 16px rgba(0,0,0,0.1)`。テーマ対応では `light-dark(0 1px 8px rgba(0,0,0,0.05), none)` のようにダーク時は影を消す書き方も使う。

**transition —— 二層構成。** 微小 UI（色・下線・背景）は `0.15s`、テーマ切替（`background`/`color`/`border-color`）は `0.4s`、トグル・ハンバーガーの動きは `0.35s`。イージングは基本デフォルト、動きのある部品のみ `cubic-bezier(0.4, 0, 0.2, 1)`。

**フォーカス／アクセシビリティ —— `outline` を消したら必ず代替を用意。** 既定リングを `outline: none` で抑えたうえで、`:focus-visible` で `outline: 2px solid Highlight; outline-offset: 1px` のように **システムカラー `Highlight`** で自作する（ハイコントラスト設定に追従）。SVG 図解ではフォーカスリングを `stroke: Highlight` で描く。インタラクティブな SVG 要素には `role` / `aria-*` / `tabindex` / キーボードハンドラを丁寧に付与する（代表: `ToneSelector`）。

**ボタン —— 2 系統。**
- アウトライン型（副次アクション）: `background: none; border: 1.5px solid var(--color-border, #ccc)`、hover で `border-color` を濃く。
- ソリッド型（主要アクション）: `background: var(--color-text, #111); color: light-dark(#fff, #1a1a1a)`、hover で `opacity: 0.8`。
- 共通: `border-radius: 4–6px`、`padding: 0.4–0.75rem`、`font-size: 0.78–0.9rem`、`cursor: pointer`。無効時は `opacity: 0.4; cursor: not-allowed`。アイコンのみボタンは `background: none; border: none; padding: 0` を基本に、リング・グロー・変形で状態を表す。

### 視覚的シグネチャ

- **グラデ下線スワイプ:** リンクの下線を `background-image` のグラデで仕込み、`background-size: 0 1.5px`（初期）→ hover/`.active` で `100% 1.5px` に伸ばす。ナビ・パンくず・フッターを貫く共通イディオム（`SiteHeader` / `Breadcrumb` / `SiteFooter`）。
- **カードのリフト:** hover で `transform: translateY(-2px)` ＋ `box-shadow: 0 4px 16px rgba(0,0,0,0.1)`（`FamilyCard` ほか）。
- **相対色ホバー:** `oklch(from … calc(l * 0.75) …)` / `rgb(from … / 20%)` で対象色から暗色・半透明を導出。

### 主要コンポーネント

- **SiteHeader（`lib/components/site-layout/SiteHeader.svelte`）:** スティッキー（`top: 0; z-index: 100`）＋すりガラス（`backdrop-filter: blur(14px)`、`background: light-dark(rgba(255,255,255,0.85), rgba(12,12,20,0.85))`、下辺に極薄ボーダー）。内枠 `max-width: 960px`。ロゴ「Color」＋「Prism」（"Prism" 側は虹色グラデを `background-clip: text` で文字塗り）。640px 以上でワイドナビ、未満でハンバーガー→ドロップダウン。最下部に 12 色の「色相ドリップバー」装飾。
- **SiteFooter（`SiteFooter.svelte`）:** 記事ページでは prev/next/一覧のページ送り（`container-type: inline-size` + `cqw` グリッド）、他は単一リンク。上辺に `border-image` のグラデ罫線（ダーク時 `opacity: 0.4`）。
- **Heading1:** アイコン付きページ見出し。`display: grid; grid-template-columns: auto 1fr; gap: 0.55rem`、アイコン色 `light-dark(#7c3aed, #c4b5fd)`、`grayscale` prop で `color-mix()` により脱色。
- **CopyButton:** 唯一の共有ボタン。`1.75rem` 角、対象色から相対導出したボーダー（`rgb(from … / 35%)`）、`border-radius: 0.25rem`、1.5 秒の「Copied!」ツールチップ。
- **AnkiModeToggle / SwitchLightDark:** ピル型トグルと発光リング付きテーマ切替。動きは `cubic-bezier(0.4, 0, 0.2, 1)`、状態色は `light-dark()`。
- **FamilyCard（`lib/components/jis-color-map/FamilyCard.svelte`）:** JIS ファミリーのリンクカード。`border: 1px solid light-dark(#e0e0e0, #2e2e3e); border-radius: 6px; overflow: hidden`、hover でリフト。アプリ最頻のカードパターン。
- **ToneSelector（`lib/components/patterns/ToneSelector.svelte`）:** PCCS トーンマップ（SVG）。Popover API + CSS Anchor Positioning（`position-try-fallbacks: flip-inline`）でサブトーン選択。アクセシビリティ実装の手本。

---

## デモ・図解コンポーネントの注意

`lib/demo/` の図解（SVG / Canvas / Threlte 3D）は「色そのものを見せる」ため、通常のプロース規約とは別扱いになる。

- 色は図の一部なのでハードコード HEX / 局所 `light-dark()` で構わない。テーマ追従が必要なら CSS の `light-dark()`、JS 描画では `lightModeState.isLightMode` を直接読む。
- Threlte（3D）で色見本を描くときは、Canvas 既定の AgX トーンマッピングが高彩度色を褪色させるため `NoToneMapping` を指定する。
- SVG 図解の作成時は `svg-diagram-component` スキルのガイドラインに従う。

---

## コード生成時のチェックリスト

1. テキスト色を `var(--color-heading)` / `var(--color-body)` で **直接** 指定しているか（`light-dark(#…)` を再定義していないか）。
2. 新しい色を無関係な HEX で足していないか（既存トークン or 相対色 `oklch(from …)` / `color-mix()` で導出できないか）。
3. `font-family` を `var(--font-*)` 経由で指定しているか。数値・表記・HEX は `var(--font-mono)` か。
4. フォントサイズが既存の帯（キャプション `0.75–0.8rem` / 本文 `0.9rem` / 見出しランプ `0.95 / 1.2 / 1.6 / 2.2rem`）に収まっているか。新しい刻みを発明していないか。
5. 余白が非公式スケール（`0.5 / 0.75 / 1 / 1.5 / 2rem`、微小は `2 / 4 / 6 / 8px`）に沿っているか。
6. `border-radius` を既存スケール（`4px / 6px / 0.25rem / 0.5rem / 50% / 999px`）から選んでいるか。`border-radius: 0` を使っていないか。
7. ボーダーが `1px solid` ＋ `light-dark()` ペア（頻出 `light-dark(#e0e0e0, #2e2e3e)`）になっているか。
8. 影を濫用していないか（階層は色ペア＋ボーダーで、影はホバーの浮き上がり等に限定）。
9. トランジションが二層（微小 UI `0.15s`／テーマ切替 `0.4s`）に沿っているか。
10. `outline: none` の後に `:focus-visible` などで `Highlight` システムカラーの代替リングを用意しているか。インタラクティブ要素に `role` / `aria-*` / キーボード操作があるか。
11. 記事本文は `680px`（索引・ランディングは `720px`）の読み幅に収まっているか。サイドバー等を勝手に足していないか。
12. 条件分岐に `@media`（主 640px）を使い、フルイドなサイズには `cqw/cqh` を使っているか（条件付き `@container` は使わない）。
