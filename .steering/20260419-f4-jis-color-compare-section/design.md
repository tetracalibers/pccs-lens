# 設計: F4 慣用色名比較セクション

## 実装アプローチ

1. **レイアウト計算を TS に切り出し** — 既存 `JisColorMap.svelte` 内に閉じていたレイアウト計算（`placements` / `valueScale` / `equiAxis`）を `lib/jis-color-map/layout.ts` に抽出し、既存マップとミニマップで共通利用
2. **マンセル比較ユーティリティを追加** — 色相/明度/彩度の差分判定や、主要色相ラベル（赤・黄・緑・青・紫）への変換を `lib/color/munsell.ts` に実装
3. **データ取得ユーティリティを追加** — `id` から `JISColor` を引く関数を `lib/data/jis-colors.ts` に実装
4. **比較処理ロジックを TS に実装** — `JISCompareSection` を受けて、比較図に必要なデータ（両端ラベル・中間ラベルの有無・並び順）を算出する関数群を `lib/jis-color-map/compare.ts` に実装
5. **ミニマップを新規実装** — `JisMiniColorMap.svelte` が `buildJisColorMap` + 抽出した `buildMapLayout` を再利用し、コンパクトなサイズと強調/減光表示を行う
6. **比較スウォッチ 2 種を新規実装** — `CompactJisColorSwatch.svelte`（角丸正方形・ツールチップ）と `HintJisColorSwatch.svelte`（正六角形・ツールチップ）
7. **比較図 3 種を新規実装** — 色み/明度/彩度比較図
8. **比較セクション本体を新規実装** — ミニマップ + 慣用色一覧 + 比較図群 + 解説を組み合わせる
9. **`/jis-color-map/[family]` ページを改修** — subfamily ごとに見出しと比較セクション群を並べる
10. **既存 `JisColorMap.svelte` の内部を共通レイアウト関数に差し替え**（挙動は不変）

## データモデル / ユーティリティ設計

### `lib/color/munsell.ts`（追加）

```ts
// 既存に追加

// "4YR" -> "YR", "10RP" -> "RP", "N" -> null
export const munsellHueFamily = (hue: string): string | null

// マンセル色相 → 5 原色ラベル（PCCS 互換）
export type MunsellPrimaryHueLabel = "赤" | "黄" | "緑" | "青" | "紫"
export const munsellPrimaryHueLabel = (hue: string): MunsellPrimaryHueLabel | null
```

#### `munsellPrimaryHueLabel` のマッピング

`munsellHueRank`（2RP 起点で色相環を [0,100) に写像する既存関数）をベースに、以下のように**最も近い**原色ラベルに丸める。

| Munsell family | primary label |
| --- | --- |
| R  | 赤 |
| YR | rank に応じて 赤 or 黄（1〜4.99YR は赤、5〜10YR は黄。Munsell 2.5YR は赤みの橙、5YR は純橙、7.5YR は黄みの橙に対応するため境界は 5YR） |
| Y  | 黄 |
| GY | rank に応じて 黄 or 緑（境界 5GY） |
| G  | 緑 |
| BG | rank に応じて 緑 or 青（境界 5BG） |
| B  | 青 |
| PB | rank に応じて 青 or 紫（境界 5PB） |
| P  | 紫 |
| RP | rank に応じて 紫 or 赤（境界 5RP） |

これは `munsellHueRank` 上で 5 原色に対応する中心値（R=10, Y=30, G=50, B=70, P=90 相当）から最短距離で丸めるロジックに置き換え可能。実装は距離計算で統一する（100 周期の循環距離）。

### `lib/data/jis-colors.ts`（追加）

```ts
export const JIS_COLOR_BY_ID: Map<string, JISColor> = new Map(JIS_COLORS.map((c) => [c.id, c]))

export const getJisColorById = (id: string): JISColor | undefined =>
  JIS_COLOR_BY_ID.get(id)

export const getJisColorsByIds = (ids: string[]): JISColor[] =>
  ids.map((id) => JIS_COLOR_BY_ID.get(id)).filter((c): c is JISColor => c !== undefined)
```

### `lib/jis-color-map/layout.ts`（新規、`JisColorMap.svelte` からの抽出）

```ts
import type { JisColorMapData, MapCell } from "./types"

export type MapPlacement = {
  cell: MapCell
  col: number
  row: number
  rowSpan: number
}

export type MapValueScale = { value: number; row: number; rowSpan: number }
export type MapEquiAxis = { value: number; col: number; row: number }

export type MapLayout = {
  placements: MapPlacement[]
  valueScale: MapValueScale[]
  equiAxis: MapEquiAxis[]
  totalRows: number
  totalCols: number
}

export const buildMapLayout = (data: JisColorMapData): MapLayout
```

実装は現在 `JisColorMap.svelte` の `$derived.by(() => { ... })` に書かれているロジックをそのまま移植（`SvelteMap`/`SvelteSet` は通常の `Map`/`Set` に置換可能 — リアクティブ性は外側のコンポーネントで `$derived(buildMapLayout(data))` を呼び出せば確保される）。

### `lib/jis-color-map/compare.ts`（新規）

```ts
import type { JISColor } from "$lib/data/jis-colors"
import type { MunsellPrimaryHueLabel } from "$lib/color/munsell"

export type HueCompareDiagramData = {
  topLabel: MunsellPrimaryHueLabel
  bottomLabel: MunsellPrimaryHueLabel
  topHex: string    // トップ色相に対応する参考 HEX（矢印グラデーションに利用）
  bottomHex: string
}

export type ValueCompareDiagramData = {
  // 3 要素以上で不揃いの場合、中間ラベルを持つ。
  // 要素数が 2 つの場合や順序どおりの場合、middleLabel は null。
  topLabel: "高明度" | "低明度"
  middleLabel: null | "高明度" | "低明度"
  bottomLabel: "高明度" | "低明度"
}

export type ChromaCompareDiagramData = {
  topLabel: "高彩度" | "低彩度"
  middleLabel: null | "高彩度" | "低彩度"
  bottomLabel: "高彩度" | "低彩度"
}

export const hasHueDifference = (targets: JISColor[]): boolean
export const hasValueDifference = (targets: JISColor[]): boolean
export const hasChromaDifference = (targets: JISColor[]): boolean

export const buildHueCompareDiagram = (targets: JISColor[]): HueCompareDiagramData | null
export const buildValueCompareDiagram = (targets: JISColor[]): ValueCompareDiagramData | null
export const buildChromaCompareDiagram = (targets: JISColor[]): ChromaCompareDiagramData | null
```

#### 差分判定の考え方

- `hasHueDifference`: `targets.munsell` をパースして `munsellHueFamily` が 2 種以上 **または** `munsellHueRank` の値が 2 種以上あれば true（単に `munsellHueRank` の set size > 1 で判定）
- `hasValueDifference`: parsed value の set size > 1
- `hasChromaDifference`: parsed chroma の set size > 1

無彩色は `chroma = null` として `hasHueDifference` / `hasChromaDifference` の判定からは除外（明度比較図では通常どおり参加）。

#### 中間ラベル判定（明度/彩度）

- `targets.length >= 3` かつ、配列順に並べたときに明度（または彩度）の単調増加でも単調減少でもない場合、中間ラベルを挟む 3 段構成とする
- 中間ラベルは両端のラベルに対して「反対方向」のものとする（例：上端が高明度、下端が低明度なら中間は高明度 or 低明度のうち中央の値に近い方を採用）
  - 実装上は「中央値 > 平均値なら中間=高、それ以外は中間=低」などシンプルな方針に基づく。詳細は実装時に関数テストで確定

### `lib/data/jis-colors.ts` — subfamily 単位の `compareSections` 取得

既存の `JIS_COLORS_BY_SUBFAMILY`（`jisColorsJson as JISColorsBySubfamily`）を外部公開していないため、次のアクセサを追加する。

```ts
export const getCompareSectionsBySubfamily = (subfamilyId: ColorSubfamily): JISCompareSection[] =>
  JIS_COLORS_BY_SUBFAMILY[subfamilyId]?.compareSections ?? []
```

## コンポーネント設計

### 新規: `components/jis-color-map/JisColorCompareSection.svelte`

比較セクション本体。

```ts
interface Props {
  subfamilyId: ColorSubfamily
  section: JISCompareSection
}
```

処理フロー:
1. `section.targets` の各 id を `getJisColorById` で `JISColor[]` に解決
2. `section.hintJIS`・`section.hintPCCSHue` は子コンポーネントへ素通し
3. `buildHueCompareDiagram` / `buildValueCompareDiagram` / `buildChromaCompareDiagram` で比較図用データを生成（null のとき該当図は非表示）

レイアウト:

```svelte
<section class="compare">
  <div class="map-area">
    <JisMiniColorMap
      groupId={subfamilyId}
      highlightsJisIds={section.targets}
      hintJisIds={section.hintJIS}
      hintPCCSHueNums={section.hintPCCSHue}
    />
  </div>
  <div class="list-area">
    <div class="rows">
      {#each targets as jis (jis.id)}
        <div class="row">
          <JisExamLevelBadge level={jis.examLevel} />
          <JisColorPreview hex={jis.hex} />
          <JisColorInfo jis={jis} />
        </div>
      {/each}
    </div>
    <div class="diagrams">
      {#if hueDiagram}<HueCompareDiagram data={hueDiagram} />{/if}
      {#if valueDiagram}<ValueCompareDiagram data={valueDiagram} />{/if}
      {#if chromaDiagram}<ChromaCompareDiagram data={chromaDiagram} familyHex={...} />{/if}
    </div>
    <div class="descriptions">
      {#each targets as jis (jis.id)}
        <div class="desc">{#each splitByWhitespace(jis.colorDescription) as line}{line}<br/>{/each}</div>
      {/each}
    </div>
  </div>
</section>
```

プレビュー・情報・級タグはすべて 1 ファイル内に簡潔なマークアップで収める（再利用性が出てきたら後日分離）。

CSS:
- デスクトップ: `display: grid; grid-template-columns: auto 1fr; gap: 1.5rem;`
- モバイル（`@media (max-width: 640px)`）: `grid-template-columns: 1fr; grid-template-rows: auto auto;`

### 新規: `components/jis-color-map/JisMiniColorMap.svelte`

```ts
interface Props {
  groupId: ColorSubfamily
  highlightsJisIds: string[]
  hintJisIds?: string[]
  hintPCCSHueNums?: number[]
}
```

実装:
- `const data = $derived(buildJisColorMap(groupId))` — 既存ロジックそのまま
- `const layout = $derived(buildMapLayout(data))` — 抽出した共通関数
- スタイルは `JisColorMap.svelte` と同じ grid 構造。`--cell-size` を小さく設定（デスクトップ 32px、モバイル 28px）。`--map-font-*` も比例して縮める
- セルの描画時に、セルの種類と id を見て以下を分岐:
  - `cell.kind === "jis"` かつ `colors[0].id` が `highlightsJisIds` に含まれる → `<CompactJisColorSwatch colors={cell.colors} />`（フル不透明）
  - `cell.kind === "jis"` かつ `colors[0].id` が `hintJisIds` に含まれる → `<HintJisColorSwatch color={cell.colors[0]} />`（フル不透明）
  - `cell.kind === "jis"` かつ上記どちらでもない → `<CompactJisColorSwatch colors={cell.colors} dim />`（opacity 0.2）
  - `cell.kind === "pccs"` かつ `hintPCCSHueNums` が未指定、または `pccs.hueNumber` が `hintPCCSHueNums` に含まれる → `<PccsSwatch pccs={cell.pccs} />`（フル不透明）
  - `cell.kind === "pccs"` かつ含まれない → `<PccsSwatch pccs={cell.pccs} dim />`（opacity 0.2）
- PCCS スウォッチ側に `dim: boolean` Props を追加するか、親 `<div class="grid-item" class:dim>` で opacity を適用するか選択 → **親側で制御**（既存コンポーネント改修を最小化）

### 名前ツールチップ（共通仕様）

コンパクト慣用色スウォッチ・参考慣用色スウォッチの双方で、慣用色の色名はセル内には表示せず、**ホバー/フォーカス時にのみ独自ポップオーバーで表示**する。

> 理由: このセクションは「色を見て名前を予想 → 答え合わせ」という学習用途が主目的なので、色名は初期表示されず、ユーザーが意図的に露出させる UX が必要。`title` 属性ベースだと `nameSegments` の改行も表現できないため不採用。

実装パターン（既存 `patterns/ToneSelector.svelte` のポップオーバー実装に揃える）:

- ネイティブ [Popover API](https://developer.mozilla.org/ja/docs/Web/API/Popover_API) + [CSS Anchor Positioning](https://developer.mozilla.org/ja/docs/Web/CSS/anchor-name) を使用
- スウォッチ側に `anchor-name: --jis-tooltip-{id};` を付与
- ポップオーバー側に `popover="manual"` と `position-anchor: --jis-tooltip-{id};` を付与（`manual` は ESC やクリックで閉じない。hover UX のため独自に開閉制御する）
- 開閉イベント:
  - `pointerenter` / `focusin` → `popoverEl.showPopover()`
  - `pointerleave` / `focusout` → `popoverEl.hidePopover()`
- スウォッチは `tabindex="0"` を付け、キーボードフォーカスでも答え合わせ可能にする
- ツールチップ内容:
  - `nameSegments` が指定されている場合はその要素ごとに改行して表示
  - `nameSegments` が無い場合は `name` をそのまま表示
  - 複数色が重なるセル（`colors.length > 1`）では、各色のブロックを縦に並べ、色間にセパレータを入れる
  - 読み（`reading`）も併記し、色名の下に小さく表示
- `anchor-name` の値は id から一意に生成（例: `--jis-tt-${id}`）

共通部品として `components/jis-color-map/JisColorNameTooltip.svelte` を新規作成し、コンパクト/参考スウォッチ双方から利用する。

```ts
interface Props {
  colors: JISColor[]          // 複数色セル対応。参考スウォッチは 1 件のみ
  anchorName: string          // "--jis-tt-xxx"
  popoverId: string           // "jis-tt-xxx"
}
```

### 新規: `components/jis-color-map/CompactJisColorSwatch.svelte`

```ts
interface Props {
  colors: JISColor[]
}
```

- 角丸正方形、HEX で塗りつぶし
- `colors[0].id` をキーに `anchor-name` と popover id を生成
- `tabindex="0"` + `role="button"`（答え合わせ操作可能であることを示す）
- セル本体はボタン要素ではなく `<div>` + `tabindex` で実装（ネストした `<button>` を避けるため）
- pointerenter/pointerleave と focusin/focusout で `JisColorNameTooltip` を開閉

### 新規: `components/jis-color-map/HintJisColorSwatch.svelte`

```ts
interface Props {
  color: JISColor
}
```

- SVG ベースで正六角形を描画（`<svg viewBox="0 0 100 100">` に `<polygon points="...">`）
- **CSS `clip-path` ではなく SVG `<polygon>` を採用する理由**: `clip-path` は視覚的には切り抜かれるが、ポインターイベントが矩形領域で発火するブラウザ実装差がある。SVG `<polygon>` は要素そのものが六角形の形状なので、ホバー反応領域も正確に六角形に制限され、「色が付いていない部分をホバーしても反応しない」という要件を満たす
- `<polygon>` に `anchor-name: --jis-tt-xxx;` をインラインスタイルで付与（SVG 要素の `anchor-name` 対応はブラウザに差がある可能性があるため、実装時に検証 — 非対応なら `<svg>` ルート要素に付与する、あるいは `ToneSelector` と同じく SVG 外に重なる不可視 HTML アンカーを追加する方式を取る）
- `pointer-events: visiblePainted`（デフォルト）で、塗られた多角形のみイベントを受ける
- `tabindex="0"` + `role="button"` + `pointerenter` / `pointerleave` / `focusin` / `focusout` で `JisColorNameTooltip` を開閉
- 単色のみ（hint は複数色の重なりなし前提）

#### 正六角形の頂点（100×100 viewBox）

縦長の亀甲型（上下が頂点、左右が平辺）を採用する場合:

```
points="50,5 93.3,27.5 93.3,72.5 50,95 6.7,72.5 6.7,27.5"
```

縦並びで隣接セルと馴染みやすい形。実装時に実際のグリッド内見え方を確認し、横長（左右が頂点）のほうが良ければ頂点を回転する。

### 新規: `components/jis-color-map/HueCompareDiagram.svelte`

```ts
interface Props {
  data: HueCompareDiagramData
}
```

SVG ベース：
- 縦方向のコンテナに合わせて `height: 100%`
- 上下両端にラベル（`<div>赤</div>` 等）
- 中央に両方向矢印（SVG で `defs` に linearGradient、矢印の線に適用）
- 高さは親のグリッド行高に追従（`align-self: stretch` + `flex-direction: column`）

### 新規: `components/jis-color-map/ValueCompareDiagram.svelte`

```ts
interface Props {
  data: ValueCompareDiagramData
}
```

- `middleLabel` が null なら上下 2 ラベル + 片方向矢印
- `middleLabel` が非 null なら上下 + 中間の 3 ラベル + 片方向矢印 2 本
- 矢印は常に「高明度方向」に向く
- グラデーションは高明度方向に向かって明るくなるグレイ（`#000` → `#fff` or 近い範囲）

### 新規: `components/jis-color-map/ChromaCompareDiagram.svelte`

```ts
interface Props {
  data: ChromaCompareDiagramData
  familyHex: string   // ColorFamily 代表色（グラデーション終端用）
}
```

- 構造は `ValueCompareDiagram` と対称
- 矢印は高彩度方向に向く
- グラデーションは低彩度側（グレイ寄り）→ 高彩度側（`familyHex` に近い鮮やかな色）

`familyHex` は family ごとの代表色を `lib/jis-color-map/family-copy.ts` もしくは新規 `family-colors.ts` で定義する。既存の `FAMILY_DESCRIPTIONS` と近い場所に置く。

### ページ: `routes/jis-color-map/[family]/+page.svelte`（更新）

```svelte
<script lang="ts">
  import { resolve } from "$app/paths"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import JisColorMap from "$lib/components/jis-color-map/JisColorMap.svelte"
  import JisColorCompareSection from "$lib/components/jis-color-map/JisColorCompareSection.svelte"
  import {
    JIS_COLOR_FAMILIES,
    getSubfamiliesByGroup,
    getCompareSectionsBySubfamily,
    type ColorFamily
  } from "$lib/data/jis-colors"

  let { data }: { data: { family: ColorFamily } } = $props()

  const family = $derived(JIS_COLOR_FAMILIES.find((f) => f.id === data.family)!)
  const subfamilies = $derived(getSubfamiliesByGroup(data.family))
  const crumbs = $derived([
    { label: "慣用色名マップ", href: resolve("/jis-color-map") },
    { label: family.name }
  ])
</script>

<svelte:head>
  <title>{family.name}の慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Breadcrumb {crumbs} category="contents" />
    <h1>{family.name}の慣用色名マップ</h1>
  </div>

  <JisColorMap groupId={data.family} />

  <div class="compare-sections">
    {#each subfamilies as sub (sub.id)}
      {@const sections = getCompareSectionsBySubfamily(sub.id)}
      {#if sections.length > 0}
        <section class="subfamily">
          <h2>{sub.name}</h2>
          <div class="compare-list">
            {#each sections as section, i (i)}
              <JisColorCompareSection subfamilyId={sub.id} {section} />
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>
</main>
```

CSS は既存スタイルを尊重しつつ、`compare-sections` にセクション間の上下余白を付与する。

## 変更ファイル

### 新規

- `app/src/lib/jis-color-map/layout.ts` — レイアウト計算の共通化
- `app/src/lib/jis-color-map/compare.ts` — 比較図用データ生成
- `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte`
- `app/src/lib/components/jis-color-map/JisMiniColorMap.svelte`
- `app/src/lib/components/jis-color-map/CompactJisColorSwatch.svelte`
- `app/src/lib/components/jis-color-map/HintJisColorSwatch.svelte`
- `app/src/lib/components/jis-color-map/JisColorNameTooltip.svelte` — 共通ツールチップ（Popover API + Anchor Positioning）
- `app/src/lib/components/jis-color-map/HueCompareDiagram.svelte`
- `app/src/lib/components/jis-color-map/ValueCompareDiagram.svelte`
- `app/src/lib/components/jis-color-map/ChromaCompareDiagram.svelte`

### 更新

- `app/src/lib/color/munsell.ts` — `munsellHueFamily` / `munsellPrimaryHueLabel` を追加
- `app/src/lib/data/jis-colors.ts` — `JIS_COLOR_BY_ID` / `getJisColorById` / `getJisColorsByIds` / `getCompareSectionsBySubfamily` を追加
- `app/src/lib/jis-color-map/family-copy.ts` — `FAMILY_PRIMARY_HEX: Record<ColorFamily, string>` を追加（彩度比較図用）
- `app/src/lib/components/jis-color-map/JisColorMap.svelte` — レイアウト計算を `buildMapLayout` に差し替え（挙動不変）
- `app/src/routes/jis-color-map/[family]/+page.svelte` — subfamily ごとの比較セクション群を追加
- `docs/repository-structure.md` — 新規ファイル追加の反映

### 変更しない

- `app/src/lib/components/jis-color-map/JisColorSwatch.svelte`
- `app/src/lib/components/jis-color-map/PccsSwatch.svelte`
- `app/src/lib/components/jis-color-map/ValueSwatch.svelte`
- `app/src/lib/components/jis-color-map/FamilyCard.svelte`
- `app/src/lib/jis-color-map/build-map.ts`（`JisColorMapData` 生成ロジックは触らない）
- `app/src/lib/jis-color-map/types.ts`
- `app/src/routes/jis-color-map/+page.svelte`（一覧は変更不要）
- `app/src/lib/jis-color-map/family-checker.ts`

## 影響範囲

- `/jis-color-map/[family]` ページの表示内容のみ（マップ下に比較セクション群が追加）
- `JisColorMap.svelte` はリファクタのみで挙動不変 — `/jis-color-map/[family]` 以外（例: トップページからの直接利用がある場合）の見た目には影響しない想定
- データ（`jis_colors.json`）は追加・変更なし（既に `compareSections` は投入済み）

## スタイリング方針

- `@css-styling-guideline` を遵守
- 既存の `--cell-size`・`--map-font-*` 変数パターンをミニマップにも踏襲
- ダークモード: 既存の変数（`--color-body`・`--color-bg` など）を使用して対応
- 比較図は SVG を基本採用（スケーラブルでグラデーションが扱いやすい）

## エッジケース

| ケース | 挙動 |
| --- | --- |
| `targets.length === 1` | 比較図は全て非表示。慣用色情報と解説のみ表示 |
| `targets` に `getJisColorById` で解決できない id を含む | `filter` で落とす（型安全）。存在しない id はログ出力 |
| `hintJIS` が未指定 | 参考慣用色スウォッチは描画されない |
| `hintPCCSHue` が未指定 | `hintPCCSHueNums` が undefined → すべての PCCS セルを通常表示（`dim` にしない） |
| `targets` 全色が無彩色（chroma=null） | 色み比較図・彩度比較図は非表示、明度比較図のみ表示される可能性あり |
| `colorDescription` が空文字 | 解説行は空行として描画（実装時に空ならスキップでも可） |
| `nameSegments` があるセル | ポップオーバー内で要素ごとに `<br>` で改行 |
| 同一セルに複数の慣用色が重なる（`colors.length > 1`） | ポップオーバー内でセパレータ区切りで全色を縦並び表示 |
| タッチデバイスで hover が不可 | `tabindex="0"` + `focusin` で答え合わせ可能（タップでフォーカスが当たる） |
| subfamily に `compareSections` が 1 件も無い | `subfamily` セクション自体を描画しない |

## オープンな判断事項（実装時に確定）

- 比較図の具体的な配色（グラデーションの両端色の選択）
- 正六角形の向き（縦長の亀甲型 vs 横長）
- SVG `<polygon>` への `anchor-name` 適用が動かない場合のフォールバック（`<svg>` ルート or 不可視 HTML アンカー）
- 中間ラベル判定の具体式（単調増加/減少の判定アルゴリズム）
- `FAMILY_PRIMARY_HEX` の具体値（family 内の彩度最大色を自動選択するか、手書き辞書か）
