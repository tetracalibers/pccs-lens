# 設計：F3 イメージ別配色シミュレータ（機能1〜4）

## 実装アプローチ

SvelteKit のファイルベースルーティングで `/patterns` と `/patterns/[theme]` を追加する。
状態管理はすべてクライアントサイドの Svelte 5 リアクティビティ（`$state` / `$derived`）で完結させる。
サジェスト計算ロジックはUIから独立した純粋関数として `src/lib/patterns/` に配置する。

---

## 新規作成ファイル

### ロジック層（`src/lib/patterns/`）

#### `types.ts` — F3用型定義

```typescript
export type ThemeId =
  | 'elegant' | 'casual' | 'classic' | 'clear' | 'chic'
  | 'dynamic' | 'warm-natural' | 'fresh-natural' | 'modern' | 'romantic'

export type ColorRole = 'base' | 'assort' | 'accent'

// 色相選択の状態（null = 無彩色が選択されている）
export type SelectedColor = {
  hueNumber: number | null
  toneSymbol: string       // トーン記号（'p', 'ltGy', 'Bk' 等）
}

export type SuggestInput = {
  theme: ThemeId
  role: ColorRole
  baseColor?: SelectedColor
  assortColor?: SelectedColor
}

export type SuggestOutput = {
  suggestedHues: number[]   // 推奨色相番号（有彩色のみ）
  suggestedTones: string[]  // 推奨トーン記号（有彩色・無彩色混在可）
}

export type ThemeDef = {
  id: ThemeId
  labelJa: string          // 日本語名（例：エレガント）
  labelEn: string          // 英語名（例：elegant）
  imageDescription: string // イメージ説明（例：女性的な・気品のある・洗練された）
  coloringDescription: string // 配色の特徴
  allowedHues: number[]    // テーマ全体で選択可能な色相番号
  allowedTones: string[]   // テーマ全体で選択可能なトーン記号
  isDynamic: boolean       // ダイナミックテーマ（面積比 1:1:1）か否か
  roleDescriptions: Record<ColorRole, string> // 各ロールの説明文
}
```

#### `themes.ts` — テーマ定義データ

`image-based-color-rules.md §2` の全10テーマの定義を `ThemeDef[]` として実装する。

```typescript
export const THEMES: ThemeDef[] = [
  {
    id: 'elegant',
    labelJa: 'エレガント',
    labelEn: 'Elegant',
    imageDescription: '女性的な・気品のある・洗練された・優雅な',
    coloringDescription: 'パープル系の明清色・高明度中間色の組み合わせ。明度差を抑えた上品なコントラスト。',
    allowedHues: [19, 20, 21, 22, 23, 24, 1],
    allowedTones: ['p', 'ltg', 'lt', 'b'],
    isDynamic: false,
    roleDescriptions: {
      base: '紫〜赤紫系の淡いパープル（pトーン・ltgトーン）',
      assort: 'ベースと同じ色相グループから、ひとつ鮮やかなトーンの色',
      accent: 'ベース・アソートと調和する、控えめなトーンの色',
    },
  },
  // ... 残り9テーマ
]

export function getTheme(id: string): ThemeDef | undefined {
  return THEMES.find(t => t.id === id)
}
```

#### `suggest.ts` — サジェスト計算ロジック

`image-based-color-rules.md §4` の計算フローを純粋関数として実装する。

```typescript
export function computeSuggest(input: SuggestInput): SuggestOutput

// 補助ユーティリティ（内部使用）
function hueDistance(a: number, b: number): number   // 24色相環最短距離
function getOneStepMoreChromatic(tone: string): string | null
```

- 静的サジェスト / 動的サジェスト（baseColor・assortColor に依存）を各テーマ別に実装
- 結果が0件の場合はテーマの `allowedHues` / `allowedTones` をそのまま返す（フォールバック）

#### `lookup.ts` — PCCSColor取得ユーティリティ

```typescript
import pccsColorsFull from '$lib/data/pccs_colors_full.json'

// 有彩色: hueNumber + toneSymbol でルックアップ
// 無彩色: toneSymbol（= achromaticBucket）でルックアップ
export function lookupPCCSColor(
  hueNumber: number | null,
  toneSymbol: string
): PCCSColor | undefined

// サジェスト内からランダムに SelectedColor を1件選択する
export function pickRandomSuggest(suggest: SuggestOutput): SelectedColor
```

#### `suggest.spec.ts` — サジェストロジックのユニットテスト

`suggest.ts` に対応するテスト。主要テーマ・役割の境界ケースを検証する。

---

### UIコンポーネント（`src/lib/components/patterns/`）

F3でしか使わないコンポーネントはすべて `src/lib/components/patterns/` 配下に配置する。

#### `HueSelector.svelte` — インタラクティブ色相選択UI

既存 `HueWheel.svelte`（read-only）とは別に新規作成する。

**Props:**
```typescript
{
  value: number | null           // 選択中の色相番号（null=無彩色選択時）
  suggestedHues: number[]        // サジェストする色相番号（ハイライト表示）
  allowedHues: number[]          // テーマの色相範囲（サジェスト外だが薄く表示）
  onselect: (hue: number) => void
}
```

**表示仕様:**
- 24の扇形を円環状に配置（既存 HueWheel のSVG構造を参考）
- `suggestedHues` に含まれる扇形：明るくハイライト
- `allowedHues` にはあるが `suggestedHues` に含まれない扇形：中間輝度で表示
- 上記以外（テーマ範囲外）：低輝度（薄く）で表示
- `value` に対応する扇形：白枠ボーダーで「選択中」を表示
- `value === null`（無彩色選択中）：全扇形をデフォルト状態（ハイライトなし）で表示
- クリックで `onselect` を呼び出す

#### `ToneSelector.svelte` — インタラクティブトーン選択UI

既存 `ToneDiagram.svelte`（read-only）とは別に新規作成する。

**Props:**
```typescript
{
  value: string                  // 選択中のトーン記号
  suggestedTones: string[]       // サジェストするトーン記号（ハイライト）
  allowedTones: string[]         // テーマのトーン範囲
  onselect: (tone: string) => void
}
```

**表示仕様:**
- 既存 ToneDiagram のセルレイアウト（無彩色列・有彩色列）を踏襲
- `suggestedTones` に含まれるセル：明るくハイライト
- `allowedTones` にあるが `suggestedTones` 外のセル：中間輝度
- テーマ範囲外のセル：低輝度（薄く）
- `value` に対応するセル：白枠ボーダーで「選択中」を表示
- クリックで `onselect` を呼び出す

#### `ThemeColorSchemePreview.svelte` — 面積比率プレビュー

**Props:**
```typescript
{
  base: PCCSColor
  assort: PCCSColor
  accent: PCCSColor | null
  isDynamic: boolean
}
```

**表示仕様:**
- スウォッチを横並びにし、flex の `flex-grow` で面積比率を表現
  - アクセントなし: base=7, assort=3
  - アクセントあり（通常）: base=6, assort=3, accent=1
  - ダイナミック（アクセントあり）: base=1, assort=1, accent=1
- 各スウォッチにPCCS表記（例：`v2`）とHEXコードを表示
- HEXコードの隣に既存 `CopyButton.svelte` を配置

---

### ルート（`src/routes/`）

#### `patterns/+page.svelte` — テーマ一覧ページ

- `THEMES` をインポートしてグリッド表示
- 各カードに `labelJa` / `labelEn` / `imageDescription` を表示
- テーマの `allowedTones`・`allowedHues` から代表色（初期サジェストの1色）を算出しカードのアクセントカラーとして使う
- `/patterns/[theme.id]` へのリンク

#### `patterns/[theme]/+page.ts` — テーマ検証

```typescript
import { error } from '@sveltejs/kit'
import { getTheme } from '$lib/patterns/themes'

export function load({ params }) {
  const theme = getTheme(params.theme)
  if (!theme) error(404, 'Theme not found')
  return { theme }
}
```

#### `patterns/[theme]/+page.svelte` — テーマ別シミュレータページ

**状態:**
```svelte
let baseColor = $state<SelectedColor>(/* 初期値: サジェスト内からランダム */)
let assortColor = $state<SelectedColor>(/* 初期値: ベースを基にサジェスト内からランダム */)
let accentColor = $state<SelectedColor | null>(null)
let showAccent = $state(false)
```

**派生値:**
```svelte
let baseSuggest = $derived(computeSuggest({ theme: data.theme.id, role: 'base', baseColor, assortColor }))
let assortSuggest = $derived(computeSuggest({ theme: data.theme.id, role: 'assort', baseColor, assortColor }))
let accentSuggest = $derived(computeSuggest({ theme: data.theme.id, role: 'accent', baseColor, assortColor }))

let basePCCS = $derived(lookupPCCSColor(baseColor.hueNumber, baseColor.toneSymbol))
let assortPCCS = $derived(lookupPCCSColor(assortColor.hueNumber, assortColor.toneSymbol))
let accentPCCS = $derived(accentColor ? lookupPCCSColor(accentColor.hueNumber, accentColor.toneSymbol) : null)
```

**レイアウト構成:**
```
<h1>テーマ名</h1>
<section class="description">配色ルール解説文</section>

<section class="color-pickers">
  <ThemeColorPicker role="base" ... />
  <ThemeColorPicker role="assort" ... />
  {#if showAccent}
    <ThemeColorPicker role="accent" ... />
  {/if}
  <button>アクセントカラーを追加する</button>
</section>

<section class="preview">
  <ThemeColorSchemePreview ... />
</section>
```

---

## 変更するファイル

### `src/routes/+layout.svelte`

ナビゲーションに「配色シミュレータ」リンクを追加する。

```svelte
<li>
  <a href={resolve("/patterns")} class:active={page.url.pathname.startsWith("/patterns")}>
    配色シミュレータ
  </a>
</li>
```

### `docs/functional-design.md`

システム構成に F3 ルートを追記する（軽微な更新）。

---

## データ構造の変更

- `src/lib/data/types.ts` への変更なし（`PCCSColor` 型はそのまま流用）
- F3固有の型は `src/lib/patterns/types.ts` に追加

---

## 影響範囲の分析

| ファイル | 種別 | 内容 |
|---|---|---|
| `src/lib/patterns/types.ts` | 新規 | F3型定義 |
| `src/lib/patterns/themes.ts` | 新規 | テーマ定義データ |
| `src/lib/patterns/suggest.ts` | 新規 | サジェスト計算ロジック |
| `src/lib/patterns/lookup.ts` | 新規 | PCCSColor取得ユーティリティ |
| `src/lib/patterns/suggest.spec.ts` | 新規 | ユニットテスト |
| `src/lib/components/patterns/HueSelector.svelte` | 新規 | インタラクティブ色相UI |
| `src/lib/components/patterns/ToneSelector.svelte` | 新規 | インタラクティブトーンUI |
| `src/lib/components/patterns/ThemeColorSchemePreview.svelte` | 新規 | 面積比率プレビュー |
| `src/routes/patterns/+page.svelte` | 新規 | テーマ一覧 |
| `src/routes/patterns/[theme]/+page.ts` | 新規 | テーマ検証 |
| `src/routes/patterns/[theme]/+page.svelte` | 新規 | テーマシミュレータ |
| `src/routes/+layout.svelte` | 変更 | ナビリンク追加 |
| `docs/functional-design.md` | 変更 | F3ルート追記 |

既存の F1・F2 の実装への影響はなし。
