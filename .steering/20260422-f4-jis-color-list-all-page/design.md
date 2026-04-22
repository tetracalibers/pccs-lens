# 設計: F4 慣用色名一覧リストページの実装

## 実装アプローチ

1. **並び順ロジックを `lib/jis-color-map/sort.ts` に実装** — マンセル色相順（起点 2RP）・明度降順・彩度降順のソートキー計算を純粋関数として切り出し、ページの `+page.ts` から利用する
2. **データ取得関数を `lib/data/jis-colors.ts` に追加** — 全慣用色を並び順ロジックで整列して返す `getSortedAllJisColors()` を実装する
3. **級タグを共通コンポーネントとして切り出す** — `JisColorCompareSection.svelte` のインライン実装を `JisExamLevelBadge.svelte` に置き換える（外部インタフェース・挙動は不変）
4. **慣用色名詳細セクションを新規実装** — family 単位でまとめた `JisColorDetailSection.svelte` を作成し、1色 = 1エントリの詳細表示を担う
5. **一覧ページへのリンクカードを独立実装** — `FamilyCard.svelte` と類似の外観を持ちつつ、7色グリッドの `.card-checker` を持つ `JisColorAllListCard.svelte` を新規作成する
6. **一覧ページを新規実装** — `/jis-color-map/all` の `+page.ts` と `+page.svelte` を追加する
7. **トップページを改修** — `+page.svelte` に「一覧で覚える」セクションと `JisColorAllListCard` を追加する

---

## 変更・追加するファイルの一覧

### 新規

| パス | 区分 | 責務 |
|---|---|---|
| `app/src/lib/jis-color-map/sort.ts` | TSモジュール | 慣用色の並び順ロジック（マンセル色相ランク昇順 → 明度降順 → 彩度降順、無彩色は末尾に明度降順） |
| `app/src/lib/components/jis-color-map/JisExamLevelBadge.svelte` | Svelteコンポーネント | 級タグ共通コンポーネント（`examLevel: 2 \| 3 \| null`）。`null` 時はスペーサーを出力 |
| `app/src/lib/components/jis-color-map/JisColorDetailSection.svelte` | Svelteコンポーネント | family 単位の慣用色名詳細セクション（見出し + 各色エントリの一覧） |
| `app/src/lib/components/jis-color-map/JisColorAllListCard.svelte` | Svelteコンポーネント | 全一覧ページへのリンクカード（7色チェッカー模様） |
| `app/src/routes/jis-color-map/all/+page.ts` | SvelteKitルート | `ssr = false`。全慣用色データを取得・整列してページに渡す |
| `app/src/routes/jis-color-map/all/+page.svelte` | SvelteKitルート | 慣用色名一覧リストページ本体 |

### 更新

| パス | 変更内容 |
|---|---|
| `app/src/lib/data/jis-colors.ts` | `getSortedAllJisColors()` 関数を追加 |
| `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte` | 級タグのインライン実装を `JisExamLevelBadge` の使用に置き換え（挙動・見た目は不変） |
| `app/src/routes/jis-color-map/+page.svelte` | 「一覧で覚える」セクションと `JisColorAllListCard` を `FamilyCard` グリッドの上に追加 |
| `docs/repository-structure.md` | 新規ファイルの追加を反映 |

### 変更しない

- `app/src/lib/components/jis-color-map/FamilyCard.svelte`（Props・スロット含め外部インタフェースを一切変更しない）
- `app/src/lib/color/munsell.ts`（`munsellHueRank` / `parseMunsell` は既存実装をそのまま利用）
- `app/src/lib/jis-color-map/family-checker.ts`
- `app/src/lib/jis-color-map/family-copy.ts`
- `app/src/routes/jis-color-map/[family]/+page.svelte` / `+page.ts`

---

## データ構造の変更

型定義の追加・変更はなし。既存の `JISColor`・`JISColorFamily`・`ColorFamily`・`JIS_COLOR_ICON_MAP` をそのまま利用する。

`lib/data/jis-colors.ts` に追加する関数:

```ts
// 有彩色・無彩色を分離してそれぞれ並び替え、連結して返す
export const getSortedAllJisColors = (): JISColor[] => {
  // sortJisColors() は lib/jis-color-map/sort.ts から import
  return sortJisColors(JIS_COLORS)
}
```

---

## ユーティリティ・データ層の設計

### `lib/jis-color-map/sort.ts`（新規）

```ts
import { parseMunsell, munsellHueRank } from "$lib/color/munsell"
import type { JISColor } from "$lib/data/jis-colors"

/**
 * 慣用色の配列をマンセル色相順（起点 2RP）でソートして返す。
 * 有彩色: 色相ランク昇順 → 明度降順 → 彩度降順
 * 無彩色: 有彩色の末尾に配置し、明度降順
 */
export const sortJisColors = (colors: JISColor[]): JISColor[]
```

内部実装方針:
- `parseMunsell(jisColor.munsell)` で `MunsellColor` を取得する
- `isNeutral: true` の色（`munsell` が `N` で始まるもの）を無彩色として末尾グループへ分類する
- 有彩色は `munsellHueRank(parsed.hue)` を第1ソートキー（昇順）、`parsed.value` を第2ソートキー（降順）、`parsed.chroma` を第3ソートキー（降順）とする
- `munsellHueRank` が `null` を返す不正値は末尾に退避する（`console.error` を出力し、無彩色グループの後ろに置く）
- 無彩色は `parsed.value` 降順のみでソートする
- 最終的に `[有彩色ソート済み, 無彩色ソート済み]` を結合して返す

テストファイル: `app/src/lib/jis-color-map/sort.spec.ts`（並び順の境界値・無彩色混在・不正値を含む）

### `lib/data/jis-colors.ts` への追加

`JIS_COLORS` は既に `JIS_COLOR_FAMILIES` の列挙順（red → brown → yellow → green → blue → purple → neutral）でフラット化されて存在する。`getSortedAllJisColors()` は `sortJisColors(JIS_COLORS)` を呼ぶだけでよい。

---

## コンポーネント設計

### `JisExamLevelBadge.svelte`（新規）

Props:
```ts
interface Props {
  examLevel: 2 | 3 | null
}
```

挙動:
- `examLevel === 2` → `2級` バッジ（背景: `var(--color-grade-2)`）
- `examLevel === 3` → `3級` バッジ（背景: `var(--color-grade-3)`）
- `examLevel === null` → `visibility: hidden` のスペーサー（同一スタイルクラスの空要素）

スタイルは `JisColorCompareSection.svelte` の `.level` / `.level-2` / `.level-3` / `.level-none` を移植する。

`JisColorCompareSection.svelte` への適用:
- `{#if jis.examLevel !== null} ... {:else} ...` のブロックを `<JisExamLevelBadge examLevel={jis.examLevel} />` 1行に置き換える
- `.level` / `.level-2` / `.level-3` / `.level-none` スタイル定義を `JisColorCompareSection.svelte` の `<style>` ブロックから削除する

---

### `JisColorDetailSection.svelte`（新規）

Props:
```ts
interface Props {
  family: JISColorFamily
  jisColors: JISColor[]  // 並び順確定済み・このfamilyに属する色のみ
}
```

**レイアウト構造（1エントリ）:**

```
<article class="entry" id={jisColor.id}>
  <!-- デスクトップ: 左右2カラム。モバイル: 縦積み -->
  <div class="entry-main">
    <div class="entry-identity">
      <!-- アイコン（Iconify）＋角丸正方形スウォッチ＋名前エリアの横並び -->
      <div class="icon-swatch-row">
        <Icon icon={JIS_COLOR_ICON_MAP.get(jisColor.iconKey)} style="color: {jisColor.hex};" />
        <span class="swatch" style="background-color: {jisColor.hex};"></span>
      </div>
      <div class="name-block">
        <JisExamLevelBadge examLevel={jisColor.examLevel} />
        <h3 class="color-name" id={jisColor.id}>{jisColor.name}</h3>
        <span class="reading">{jisColor.reading}</span>
        <div class="pccs-list">
          {#each resolvedApproximatePccs as pccs (pccs.notation)}
            <PccsSwatch {pccs} compact />
          {/each}
        </div>
      </div>
    </div>
    <div class="entry-detail">
      <p class="origin-description">
        {#each splitOriginDescription(jisColor.originDescription) as segment, i (i)}
          {segment}{#if i < splitOriginDescription(jisColor.originDescription).length - 1}<br />{/if}
        {/each}
      </p>
      <dl class="meta">
        <dt>系統色名</dt><dd>{jisColor.systematicName}</dd>
        <dt>マンセル値</dt><dd class="munsell">{jisColor.munsell}</dd>
      </dl>
      <a href={resolve("/jis-color-map/[family]", { family: family.id })} class="compare-link">
        {family.name}を比較する
        <Icon icon="mdi:arrow-right" />
      </a>
    </div>
  </div>
</article>
```

**`resolvedApproximatePccs` の解決:**

`JISApproximatePccs.notation` は PCCS の記法文字列（例: `"v2"`）であり、`PccsSwatch` は `PCCSColor` を受け取る。コンポーネント内で `PCCS_ALL_MAP.get(approx.notation)` を呼び、`PCCSColor` を解決して渡す。`undefined` になる場合は描画をスキップする（`filter` で除去）。

**`splitOriginDescription` 関数:**

`originDescription` 内の空白文字（スペース・タブ）を区切りとして配列に分割する。`each` ブロックで各要素の間に `<br />` を挿入して改行を実現する。この関数はコンポーネント内に定義する（1行のシンプルな実装であるため、独立したユーティリティファイルへの切り出しは不要）。

```ts
const splitOriginDescription = (text: string): string[] => {
  if (!text) return []
  return text.split(/\s+/).filter((s) => s.length > 0)
}
```

**レイアウト:**

- デスクトップ（`min-width: 641px`）: `.entry-main` を `display: grid; grid-template-columns: auto 1fr;` で横並びにする。左カラムはアイコン・スウォッチ・名前エリア、右カラムは由来・詳細情報エリア
- モバイル（`max-width: 640px`）: `.entry-main` を `grid-template-columns: 1fr;` で縦積みにする

**見出し階層:**

ページ構造を考慮すると、`<h1>` がページタイトル「慣用色名 全一覧」、`<h2>` が family 名（「赤系」など）、`<h3>` が各慣用色名となる。`id` 属性はページ上部のアイコンからのアンカーターゲットとして `jisColor.id` を付与する。

**スクロールマージン:**

アンカー遷移のターゲットである `<h3 id={jisColor.id}>` に `scroll-margin-top` を適用して、スクロール後にページ上部のスティッキー要素（ナビゲーションバーなど）に隠れないよう配慮する（既存ページのスティッキー要素の高さを実装時に確認する）。

---

### `JisColorAllListCard.svelte`（新規）

**FamilyCard との関係:** `FamilyCard.svelte` は `.card-checker` が 2色・4セル固定のグリッドであり、Props も `family: JISColorFamily`・`labelEn: string`・`description: string`・`checkerColors: [string, string]` と専用設計になっている。リンクカードは 7色・7セルの異なるグリッド構成と固定テキストを持つため、`FamilyCard` をそのまま流用することはできない。共通の基底コンポーネントに切り出す案もあるが、カードの実装は約 100 行程度と小さく、基底コンポーネント化のオーバーヘッドのほうが大きい。そのため **独立実装** を採用し、`FamilyCard.svelte` の既存インタフェースを一切変更しない方針とする。

Props:
```ts
interface Props {
  checkerColors: [string, string, string, string, string, string, string]
}
```

タイトル「慣用色名 全一覧」・説明文「由来やPCCS近似値など、色の詳細を学ぼう」はコンポーネント内に固定値として記述し、Props として外部から渡さない。リンク先は `resolve("/jis-color-map/all")` で固定する。

**`.card-checker` の 7色グリッド:**

`FamilyCard.svelte` の既存グリッドは `grid-template-columns: 0.5fr 1fr; grid-template-rows: 1fr 0.5fr;` の 2列2行（4セル）で 2色を交互配置している。7色7セルでは以下の構成を採用する:

```
grid-template-columns: repeat(3, 1fr);
grid-template-rows: repeat(3, 1fr);
```

9セルのグリッドで末尾2セルは使用せず、7セルに7色を1色ずつ配置する。各セルは `<span class="checker-cell" style="background-color: {color};">` で実装する。`aspect-ratio: 1` と `min-width: 88px` は `FamilyCard` と共通とする。

**7色の選択方法（各 `ColorFamily` から 1色ずつ）:**

`pickCheckerboardColors`（`family-checker.ts`）と同様に `Math.random()` を用いたビルド時非決定論的な選択とする。リロードごとに色が変わる挙動は、`FamilyCard` の `.card-checker` と同様の仕様であるため一貫性がある。

`JisColorAllListCard.svelte` には `checkerColors` を Props として受け取る設計とし、色の選択は呼び出し元（`/jis-color-map/+page.svelte` のスクリプト部）で行う。

呼び出し元での選択ロジック:

```ts
// app/src/routes/jis-color-map/+page.svelte 内
import { JIS_COLOR_FAMILIES, JIS_COLORS_BY_GROUP } from "$lib/data/jis-colors"

const pickOneFromFamily = (familyId: ColorFamily): string => {
  const colors = JIS_COLORS_BY_GROUP.get(familyId) ?? []
  if (colors.length === 0) return "#cccccc"
  return colors[Math.floor(Math.random() * colors.length)].hex
}

const allListCheckerColors = JIS_COLOR_FAMILIES.map((f) => pickOneFromFamily(f.id)) as
  [string, string, string, string, string, string, string]
```

`JIS_COLOR_FAMILIES` は 7 要素（red・brown・yellow・green・blue・purple・neutral）で固定されているため、型アサーションが成立する。

---

## ページ設計

### `/jis-color-map/all/+page.ts`

```ts
export const ssr = false
// データはJIS_COLORSをそのままimportして利用するため、load関数は不要
// ページコンポーネント側で getSortedAllJisColors() と JIS_COLOR_FAMILIES を直接参照する
```

`[family]/+page.ts` と同様に `ssr = false` のみとし、`load` 関数は定義しない。全データはクライアントサイドで `lib/data/jis-colors.ts` から直接取得する（既存パターンに沿った実装）。

### `/jis-color-map/all/+page.svelte`

ページ構成:

```svelte
<svelte:head>
  <title>慣用色名 全一覧 — PCCS Lens</title>
</svelte:head>

<main>
  <!-- パンくずリスト -->
  <Breadcrumb crumbs={[
    { label: "慣用色名マップ", href: resolve("/jis-color-map") },
    { label: "全一覧" }
  ]} category="contents" />

  <!-- ページ見出し -->
  <h1>慣用色名 全一覧</h1>

  <!-- アイコン群（マンセル色相順） -->
  <div class="icon-index" aria-label="慣用色名インデックス">
    {#each sortedColors as jisColor (jisColor.id)}
      {@const iconId = JIS_COLOR_ICON_MAP.get(jisColor.iconKey)}
      {#if iconId}
        <a href="#{jisColor.id}" class="icon-anchor" aria-label={jisColor.name}>
          <Icon icon={iconId} style="color: {jisColor.hex};" />
        </a>
      {/if}
    {/each}
  </div>

  <!-- 慣用色名詳細セクション（family別） -->
  {#each JIS_COLOR_FAMILIES as family (family.id)}
    {@const familyColors = sortedColorsByFamily.get(family.id) ?? []}
    {#if familyColors.length > 0}
      <section class="family-section">
        <h2>{family.name}</h2>
        <JisColorDetailSection {family} jisColors={familyColors} />
      </section>
    {/if}
  {/each}
</main>
```

**`sortedColors` と `sortedColorsByFamily` の計算:**

```ts
// スクリプト部
import { getSortedAllJisColors, JIS_COLOR_FAMILIES, type ColorFamily } from "$lib/data/jis-colors"

const sortedColors = getSortedAllJisColors()
const sortedColorsByFamily = new Map<ColorFamily, JISColor[]>()
for (const family of JIS_COLOR_FAMILIES) {
  sortedColorsByFamily.set(family.id, sortedColors.filter((c) => /* family判定 */))
}
```

family 判定は `JIS_COLORS_BY_GROUP.get(family.id)` に含まれるかで判定する。または `sortedColors` の各色に対して `getFamilyIdBySubfamilyId` を利用した逆引きを事前に行う方法もある。後者のほうが既存関数の再利用度が高いため採用する。

### `/jis-color-map/+page.svelte` の改修

既存の `<main>` 内に「一覧で覚える」セクションを `FamilyCard` グリッドの前に追加する:

```svelte
<section class="section">
  <h2 class="section-heading">一覧で覚える</h2>
  <p class="section-desc">由来やPCCS近似値など、色の詳細を学ぼう</p>
  <JisColorAllListCard checkerColors={allListCheckerColors} />
</section>

<section class="section">
  <h2 class="section-heading">比較して覚える</h2>
  <p class="section-desc">似た色を比較して覚えよう</p>
  <div class="grid">
    {#each familyCards as card (card.family.id)}
      <FamilyCard {...card} />
    {/each}
  </div>
</section>
```

---

## アイコンからのアンカー遷移

- アイコン群の各アイコンは `<a href="#{jisColor.id}">` のインページリンクとする
- CSS で `html { scroll-behavior: smooth; }` がグローバルに設定されていれば追加作業は不要（既存設定を確認する。未設定の場合は `+page.svelte` の `<style>` 内または `+layout.svelte` で定義する）
- アンカーターゲットの要素（`<h3 id={jisColor.id}>` または `<article id={jisColor.id}>`）に `scroll-margin-top: 4rem;` 程度を付与し、固定ヘッダーに隠れないよう対処する
- a11y 対応: `<a>` には `aria-label={jisColor.name}` を付与する。アイコン自体は装飾的扱いにし、`aria-hidden="true"` を `<Icon>` に付与してリンクテキストと重複しないようにする

---

## レスポンシブ設計

既存の `JisColorCompareSection.svelte` では `@media (max-width: 800px)` を境界として使用している。本実装では **`max-width: 640px`** をモバイル境界として採用する（既存の `JisColorCompareSection` が 640px を `.--_compact` の境界として使用していることとの整合性を実装時に確認する）。

| 要素 | デスクトップ | モバイル |
|---|---|---|
| `.entry-main`（詳細セクション内） | `grid-template-columns: auto 1fr`（横並び） | `grid-template-columns: 1fr`（縦積み） |
| `.icon-index`（アイコン群） | `flex-wrap: wrap` の横並び | 同左（自動折り返し） |
| `.grid`（トップページの FamilyCard グリッド） | 既存の `repeat(auto-fill, minmax(250px, 1fr))` を維持 | 同左（自動折り返し） |

`@media (max-width: 640px)` の記述はコンポーネントの `<style>` ブロック内に scoped CSS として記述する（`@css-styling-guideline` に準拠）。

---

## `originDescription` の空白位置での改行実装

`JisColorCompareSection.svelte` で使用している `splitDescription` 関数（`text.split(/\s+/).filter((s) => s.length > 0)`）と同じ方式を採用する。

```ts
// JisColorDetailSection.svelte 内（コンポーネントスコープの関数）
const splitOriginDescription = (text: string): string[] => {
  if (!text) return []
  return text.split(/\s+/).filter((s) => s.length > 0)
}
```

テンプレート内で:
```svelte
{#each splitOriginDescription(jisColor.originDescription) as segment, i (i)}
  {segment}{#if i < splitOriginDescription(...).length - 1}<br />{/if}
{/each}
```

> `white-space: pre-wrap` によるスペース直接描画や前処理での `<br>` 挿入（`@html` 使用）は採用しない。前者はスペースが可視化される副作用があり、後者は XSS リスクがある（`development-guidelines.md` でセキュリティを考慮したコーディングが求められているため）。

---

## リンクカード `.card-checker` の 7色グリッド

**グリッド構成:**

```css
.card-checker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  flex-shrink: 0;
  aspect-ratio: 1;
  min-width: 88px;
}
```

9セルのうち 7セルを `<span class="checker-cell">` で埋め、残り 2セル（8・9番目）は空のまま（`background` が親の背景色で表示される）。7系統の色は red → brown → yellow → green → blue → purple → neutral の順で配置する。

**ランダム選択の決定論性:**

`Math.random()` を用いたリロードごとに変わる方式を採用する（`pickCheckerboardColors` と同じ方針）。ビルド時固定にするには SSG 対応が必要になるが、既存のページが `ssr = false` でビルドされているため、現時点では一貫性を優先してリロード毎変更とする。

---

## 命名規則の適用例

| 対象 | 命名案 | 根拠 |
|---|---|---|
| 並び順モジュール | `sort.ts` | 1ファイル1責務。`sort` で役割が明確 |
| 級タグコンポーネント | `JisExamLevelBadge.svelte` | `Jis` プレフィックス（既存の `JisColorCompareSection` 等に揃える）。`ExamLevel`（`examLevel` フィールド名）+`Badge`（バッジUI） |
| 詳細セクション | `JisColorDetailSection.svelte` | `JisColor` + `Detail`（詳細情報）+ `Section`（セクション単位） |
| リンクカード | `JisColorAllListCard.svelte` | `JisColor` + `AllList`（全一覧）+ `Card`（`FamilyCard` に倣う） |
| 並び順関数 | `sortJisColors` | camelCase。引数・戻り値の型が明確 |
| データ取得関数 | `getSortedAllJisColors` | `get` プレフィックス（既存の `getJisColorById` 等に揃える）+ `SortedAll` |
| アイコン群コンテナ CSS | `.icon-index` | インデックス（索引）としての役割を示す |
| 一覧ページのルート | `/jis-color-map/all/` | `all`（全一覧の意）。SvelteKit の規約上 `all` ディレクトリを作成 |

---

## 影響範囲の分析

- **既存テストへの影響**: `lib/jis-color-map/sort.ts` が新規追加のため、`sort.spec.ts` を新規作成する必要がある。既存のテストファイルへの影響はない
- **既存コンポーネントの外部インタフェースへの影響**: `JisColorCompareSection.svelte` はインライン級タグを `JisExamLevelBadge` に置き換えるが、Props・スロットは不変。`FamilyCard.svelte` は変更なし
- **他ページへの波及**:
  - `/jis-color-map` トップページに「一覧で覚える」セクションが追加される（既存の `FamilyCard` グリッドには影響なし）
  - `/jis-color-map/[family]` ページは変更なし
  - 新規ルート `/jis-color-map/all` が追加される（既存ルートに干渉しない）
- **`JIS_COLORS_BY_GROUP` のエクスポート状態**: 現在 `export` されているため、`/jis-color-map/+page.svelte` から直接参照できる

---

## 要確認事項

1. **`scroll-behavior: smooth` のグローバル適用有無**: 既存のグローバル CSS に `html { scroll-behavior: smooth; }` が設定されているか未確認。設定がない場合は `/jis-color-map/all/+page.svelte` の `<style>` か `+layout.svelte` へ追加するか、JavaScript の `scrollIntoView({ behavior: 'smooth' })` をアンカー操作時に呼ぶかを選択する必要がある
2. **固定ヘッダーの高さ**: `scroll-margin-top` の適切な値を決定するために、既存の固定ヘッダーの高さを実装時に確認する
3. **`JISColorFamily` と `JISColor` の family 帰属判定**: ページの `+page.svelte` で `sortedColors` を family 別に分類する際、各 `JISColor` がどの `ColorFamily` に属するかを効率よく判定する方法を確定する必要がある。`JIS_COLORS_BY_GROUP.get(family.id)` で取得した色の `id` セットと照合する方法が最もシンプルだが、実装時に計算量を確認する（慣用色の総数は最大 269 程度のため、線形探索で問題ない見込み）
4. **アイコン群のグリッドレイアウト**: `.icon-index` のアイコンサイズ・間隔・折り返しのデザインは実装時に決定する（モックアップがないため、`FamilyCard` や既存コンポーネントのスタイルと整合するサイズを選択する）
5. **`PccsSwatch` への `approximatePccs` の解決**: `JISApproximatePccs.notation` から `PCCS_ALL_MAP.get(notation)` で `PCCSColor` を取得できない（辞書に存在しない notation）ケースが発生する可能性がある。その場合のフォールバック表示（notation 文字列を直接表示するか、非表示にするか）を確定する必要がある
6. **`Heading1` コンポーネントの使用可否**: トップページの `<h1>` は `Heading1` コンポーネントで実装されているが、一覧ページの `<h1>` に `Heading1` を使うかどうか（アイコンが必要か）は仕様書に明記されていない。`Heading1` を使う場合は適切な iconify アイコンを選択する必要がある
7. **9セルグリッドの空セル表示**: `.card-checker` で 7色を 3×3 グリッドに配置すると末尾2セルが空になる。この部分の見た目（背景色・枠線の有無など）を実装時に確認する
