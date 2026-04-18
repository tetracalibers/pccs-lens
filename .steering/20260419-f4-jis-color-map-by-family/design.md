# 設計: F4 慣用色名比較マップ（色みごとのページ）

## 実装アプローチ

1. **データアクセサ拡張** — `jis-colors.ts` に「ファミリーIDの型ガード」を追加
2. **ランダム2色選出ユーティリティ** — `jis-color-map/` 配下に、ファミリーIDから市松模様用の2色を選ぶ純関数を実装
3. **ファミリーカード コンポーネント** — `/patterns` のカードと同じデザインで `/jis-color-map/[family]` へのリンクを提供
4. **一覧ページの改修** — 既存の `JisColorMap` 表示を削除し、ファミリーカードのグリッドに置き換え
5. **動的ルート `[family]` の追加** — `load` 関数で `ColorFamily` 妥当性検証（不正値は 404）、ページ本体は `Breadcrumb` + `Heading1` + `JisColorMap`
6. **型チェック / リント / フォーマット**

## データモデル

### 型ガード `isColorFamily(value: string)`

`ColorFamily` の妥当性検証を行うユーティリティ。`load` 関数のパラメータ検証で利用。

```ts
// app/src/lib/data/jis-colors.ts
export const isColorFamily = (value: string): value is ColorFamily => {
  return FAMILY_IDS.has(value)
}
```

`FAMILY_IDS` は既存の `Set<string>` 定数。この用途のために `Set<ColorFamily>` として再定義するか、型アサーションで対応するかを実装時に選択する。

### 一覧ページ用のファミリーカード表現

```ts
type FamilyCard = {
  family: JISColorFamily       // id, name, subfamilies を保持
  labelEn: string              // 英語識別子（`id` をそのまま表示するか別途定義）
  description: string          // 短い説明文
  checkerColors: [string, string]  // 市松模様用の2色（HEX）
}
```

- `labelEn` は `JISColorFamily.id`（例: `"red"`, `"brown"`, ...）をそのまま使う（`/patterns` では `labelEn` が別途定義されているが、慣用色マップでは family id で十分識別可能と判断）
- `description` は family ごとに短いフレーズを用意（例: 赤系 = "ピンク・赤・赤紫系の慣用色"）

## アルゴリズム詳細

### 市松模様用2色のランダム選出

```
input: family: JISColorFamily
colors = JIS_COLORS_BY_GROUP.get(family.id) ?? []
if colors.length === 0: fallback ["#cccccc", "#aaaaaa"]
if colors.length === 1: return [colors[0].hex, colors[0].hex]
[a, b] = 重複なく2色をランダム選出
return [a.hex, b.hex]
```

- 一覧ページの表示ごとにランダム化（`/patterns` と同じ方針、ページレンダリング時に決定）
- SSR と CSR で値がズレないよう、`onMount` 前（スクリプトのトップレベル）で `Math.random` を呼ぶ前提とする。既存 `/patterns/+page.svelte` も同様にトップレベルで決定している

### `[family]` パラメータ検証

```
input: params.family: string
if !isColorFamily(params.family):
  error(404, "Unknown color family")
return { family: params.family as ColorFamily }
```

SvelteKit の `+page.ts` で `load` 関数に実装。`error` は `@sveltejs/kit` から import。

## コンポーネント設計

### `components/jis-color-map/FamilyCard.svelte`（新規）

`/jis-color-map/[family]` へのリンクを `/patterns` と同じデザインで表示するカード。

```svelte
<script lang="ts">
  import { resolve } from "$app/paths"
  import type { JISColorFamily } from "$lib/data/jis-colors"

  let {
    family,
    labelEn,
    description,
    checkerColors
  }: {
    family: JISColorFamily
    labelEn: string
    description: string
    checkerColors: [string, string]
  } = $props()
</script>

<a href={resolve("/jis-color-map/[family]", { family: family.id })} class="card">
  <div class="card-checker">
    <span class="checker-cell" style="background-color: {checkerColors[0]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[1]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[1]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[0]};"></span>
  </div>
  <div class="card-body">
    <div class="card-title">
      <span class="label-ja">{family.name}</span>
      <span class="label-en">{labelEn}</span>
    </div>
    <p class="card-desc">{description}</p>
  </div>
</a>
```

- スタイルは `/patterns/+page.svelte` の `.card` 系スタイルをそのままコピー（共通化の抽出は今回のスコープ外）

### 変更: `routes/jis-color-map/+page.svelte`

既存の `JisColorMap` 表示を削除し、`FamilyCard` のグリッドに置き換える。

```svelte
<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import FamilyCard from "$lib/components/jis-color-map/FamilyCard.svelte"
  import { JIS_COLOR_FAMILIES } from "$lib/data/jis-colors"
  import { pickCheckerboardColors } from "$lib/jis-color-map/family-checker"
  import { FAMILY_DESCRIPTIONS } from "$lib/jis-color-map/family-copy"

  const familyCards = JIS_COLOR_FAMILIES.map((family) => ({
    family,
    labelEn: family.id,
    description: FAMILY_DESCRIPTIONS[family.id],
    checkerColors: pickCheckerboardColors(family.id)
  }))
</script>

<main>
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>慣用色名マップ</Heading1>
  </div>

  <div class="grid">
    {#each familyCards as card (card.family.id)}
      <FamilyCard {...card} />
    {/each}
  </div>
</main>
```

- `.grid` のスタイルは `/patterns/+page.svelte` の `.grid` と同じ（`grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))` など）
- `main` の `max-width` は `/patterns` と同じ 720px を採用し、カードの見た目を揃える

### 新規: `routes/jis-color-map/[family]/+page.ts`

```ts
import { error } from "@sveltejs/kit"
import { isColorFamily } from "$lib/data/jis-colors"
import type { PageLoad } from "./$types"

export const load: PageLoad = ({ params }) => {
  if (!isColorFamily(params.family)) {
    error(404, "Unknown color family")
  }
  return { family: params.family }
}
```

### 新規: `routes/jis-color-map/[family]/+page.svelte`

```svelte
<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import JisColorMap from "$lib/components/jis-color-map/JisColorMap.svelte"
  import { JIS_COLOR_FAMILIES } from "$lib/data/jis-colors"
  import { resolve } from "$app/paths"

  let { data } = $props()
  const family = $derived(
    JIS_COLOR_FAMILIES.find((f) => f.id === data.family)!
  )
  const crumbs = $derived([
    { label: "慣用色名マップ", href: resolve("/jis-color-map") },
    { label: family.name }
  ])
</script>

<svelte:head>
  <title>{family.name}の慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <Breadcrumb {crumbs} category="contents" />
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>
      {family.name}の慣用色名マップ
    </Heading1>
  </div>

  <JisColorMap groupId={data.family} />
</main>
```

- `Breadcrumb` の `category` は既存の top-level コンテンツページ群と揃えるため `"contents"` を選択（`/patterns` は実装状況次第だが、慣用色名マップは「学ぶ・比べる」系なので `contents` が自然）
- `JisColorMap` の `groupId` には `ColorFamily` を渡す（既存コンポーネントは `JISColorGroupId = ColorFamily | ColorSubfamily | "all"` を受け付けるため変更不要）

## ロジックファイル設計

### `lib/jis-color-map/family-checker.ts`（新規）

```ts
import { JIS_COLORS_BY_GROUP, type ColorFamily } from "$lib/data/jis-colors"

const FALLBACK: [string, string] = ["#cccccc", "#aaaaaa"]

export const pickCheckerboardColors = (familyId: ColorFamily): [string, string] => {
  const colors = JIS_COLORS_BY_GROUP.get(familyId) ?? []
  if (colors.length === 0) return FALLBACK
  if (colors.length === 1) return [colors[0].hex, colors[0].hex]
  const firstIdx = Math.floor(Math.random() * colors.length)
  let secondIdx = Math.floor(Math.random() * (colors.length - 1))
  if (secondIdx >= firstIdx) secondIdx += 1
  return [colors[firstIdx].hex, colors[secondIdx].hex]
}
```

- ランダム2色選出の純関数
- コンポーネント非依存のためテスト可能

### `lib/jis-color-map/family-copy.ts`（新規）

一覧ページのカードで使う短い説明文。family id をキーに持つ辞書。

```ts
import type { ColorFamily } from "$lib/data/jis-colors"

export const FAMILY_DESCRIPTIONS: Record<ColorFamily, string> = {
  red: "ピンク・赤・赤紫系の慣用色",
  brown: "明るい茶・暗い茶系の慣用色",
  yellow: "薄めの黄・濃いめの黄系の慣用色",
  green: "黄緑・青緑系の慣用色",
  blue: "水色・青・青紫系の慣用色",
  purple: "薄紫・濃い紫・赤紫系の慣用色",
  neutral: "準無彩色・灰色系の慣用色"
}
```

文言は実装時に自然な表現に調整する（最終案は PR レビューで確定）。

### `lib/data/jis-colors.ts`（更新）

```ts
const FAMILY_IDS = new Set<ColorFamily>(JIS_COLOR_FAMILIES.map((f) => f.id))

export const isColorFamily = (value: string): value is ColorFamily =>
  (FAMILY_IDS as Set<string>).has(value)
```

既存の `FAMILY_IDS: Set<string>` を `Set<ColorFamily>` に型を狭めて、`isColorFamily` から利用する。`getSubfamiliesByGroup` 内の `FAMILY_IDS.has(groupId)` は `groupId` が `string` なので `as Set<string>` 経由でアクセスするか、`has` を受け入れ可能な形にする。

## 変更ファイル

### 新規

- `app/src/lib/jis-color-map/family-checker.ts` — 市松模様用2色ランダム選出
- `app/src/lib/jis-color-map/family-copy.ts` — ファミリー説明文辞書
- `app/src/lib/components/jis-color-map/FamilyCard.svelte` — ファミリーカード（リンク）
- `app/src/routes/jis-color-map/[family]/+page.ts` — `load`（404 検証）
- `app/src/routes/jis-color-map/[family]/+page.svelte` — ファミリーページ本体

### 更新

- `app/src/lib/data/jis-colors.ts`
  - `isColorFamily` 関数を追加
  - `FAMILY_IDS` を `Set<ColorFamily>` に型更新（既存参照箇所の整合性に注意）
- `app/src/routes/jis-color-map/+page.svelte`
  - `JisColorMap` の描画を削除
  - `FamilyCard` のグリッドを表示
  - 必要に応じて `max-width` 等のレイアウト調整

### 変更しない

- `app/src/lib/components/jis-color-map/JisColorMap.svelte`
- `app/src/lib/components/jis-color-map/JisColorSwatch.svelte`
- `app/src/lib/components/jis-color-map/PccsSwatch.svelte`
- `app/src/lib/components/jis-color-map/ValueSwatch.svelte`
- `app/src/lib/jis-color-map/build-map.ts`
- `app/src/lib/jis-color-map/types.ts`
- `app/src/lib/color/munsell.ts`
- `app/src/routes/+page.svelte`（既に `/jis-color-map` へのリンクが「コンテンツ」セクションに存在）

## 影響範囲

- `/jis-color-map` にアクセスしたときの表示が変わる（マップ直表示 → リンク一覧）
- 既存のトップページの `/jis-color-map` へのリンクは引き続き有効（遷移先の振る舞いが変わるだけ）
- `JisColorMap` / `buildJisColorMap` は無変更のため、`groupId = "all"` を渡す箇所があっても影響なし
- 新規追加される動的ルート `[family]` は既存ルーティングと競合しない

## スタイリング方針

- `@css-styling-guideline` を遵守
- `FamilyCard` のスタイルは `/patterns/+page.svelte` の `.card` / `.card-checker` / `.card-body` 系を踏襲
  - 将来的に `/patterns` と共通化したくなる可能性はあるが、今回は最小差分のためコピーにとどめる
- `/jis-color-map/[family]` ページのレイアウトは、マップの横スクロールを許容するため `main` に `max-width` を指定しない（既存 `/jis-color-map` と同じ方針）
  - 見出し・パンくずは横幅を制限したい場合、`.header` コンテナに `margin-inline: auto` + `width: fit-content` を付ける既存パターンを踏襲
- `Breadcrumb` の `category` プロパティは `"contents"`（`/jis-color-map` は「学ぶ・比べる」系）

## エッジケース

| ケース | 挙動 |
| --- | --- |
| `colors.length === 0`（データ未登録のファミリー） | フォールバック `["#cccccc", "#aaaaaa"]` |
| `colors.length === 1` | 同じ色を2つ返す（市松模様は単色塗りになる） |
| 不正な `[family]` 値 | `+page.ts` の `load` で `error(404, ...)` |
| SSR/CSR 間のランダム値不整合 | カード単位の軽微な差異（左右配色が入れ替わる程度）は許容。`/patterns` と同じ扱い |
| ダークモード切り替え | 既存 `Breadcrumb` / `Heading1` / `JisColorMap` が対応済み。`FamilyCard` は `/patterns` と同じ変数を使用するため追加対応不要 |

## オープンな判断事項（実装時に確定）

- `FAMILY_DESCRIPTIONS` の具体的な文言（簡潔さ優先で短めに）
- `FamilyCard` で表示する英語ラベル（`family.id` をそのまま出すか、別途ケース調整するか）
- 一覧ページの `main` の `max-width` と見出し位置合わせ
