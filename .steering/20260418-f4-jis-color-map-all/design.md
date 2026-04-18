# 設計: F4 慣用色名比較マップ（全色）

## 実装アプローチ

1. **マンセルユーティリティ拡張** — `munsell.ts` に色相ランク計算を追加
2. **JIS色データアクセッサ拡張** — `jis-colors.ts` にグループ単位の取得関数を追加
3. **マップ構築ロジック** — `jis-color-map/` 配下に、描画対象色リスト → レイアウト用データ構造への変換処理を実装
4. **スウォッチコンポーネント3種** を先に実装（疎結合・単体で動作確認しやすい）
5. **慣用色名マップコンポーネント** を実装（CSS Grid で格子配置）
6. **ページ** を作成し、トップページにリンク追加
7. **型チェック / リント / フォーマット** で検証

## データモデル

### マンセル色相ランク

マンセル色相表記 `10RP`, `4R`, `2.5YR`, ... を数値ランクに変換する。`10RP = 0` を基準にして色相環一周を [0, 100) にマップ。

色相ファミリーオフセット（`10RP` を起点、反時計回りに R → YR → Y → GY → G → BG → B → PB → P → RP）:

```
R: 0, YR: 10, Y: 20, GY: 30, G: 40,
BG: 50, B: 60, PB: 70, P: 80, RP: 90
```

ランク算出: `rank = (familyOffset + hueNumber) mod 100`

- `10RP` → (90 + 10) mod 100 = 0 ← 最も若い
- `4R` → 4
- `2.5YR` → 12.5
- `5RP` → 95

### マップレイアウト構造

```ts
type MapHueColumn = {
  hue: string // 正規化後のマンセル色相表記
  rank: number // 色相ランク
}

type MapValueRow = {
  value: number // Munsell value（0.5 刻み）
  chromas: number[] // この明度に現れる彩度の昇順リスト（無彩色セルは別管理）
}

type MapJisCell = {
  kind: "jis"
  value: number
  chroma: number | null // 無彩色なら null
  hueRank: number | null // 無彩色なら null（明度スケール列）
  colors: JISColor[] // 同一マンセル値の慣用色（通常1件、同一マンセル値があれば複数）
  pccsHint?: PCCSColor // 同一マンセル値に一致する helpPCCSList の色があれば併記
}

type MapPccsCell = {
  kind: "pccs"
  value: number
  chroma: number
  hueRank: number
  pccs: PCCSColor
}

type MapCell = MapJisCell | MapPccsCell

type JisColorMapData = {
  valueRows: MapValueRow[] // value 降順
  hueColumns: MapHueColumn[] // rank 昇順
  cells: MapCell[]
  minValue: number
  maxValue: number
}
```

## アルゴリズム詳細

### Step 1: 描画対象色の取得

```
input: groupId
targetJis = JIS_COLORS_BY_GROUP.get(groupId)  // "all" の場合は JIS_COLORS
subfamilies = resolveSubfamilies(groupId)     // 関連 subfamily 全件
hintRange = {
  from: min(subfamilies.map(s => s.hintPCCSHue.from)),
  to:   max(subfamilies.map(s => s.hintPCCSHue.to))
}
helpPccsList = PCCS_V24.filter(p => hintRange.from <= p.hueNumber <= hintRange.to)
```

### Step 2: 全マンセル値のパース

```
parsed = [...targetJis, ...helpPccsList].map(c => ({
  ref: c,
  parsed: parseMunsell(c.munsell)
}))
```

`munsell` が未設定（PCCS奇数色相のvトーン）の要素は除外する（`pccs_v24` は全色 munsell を持つため実際には起こらないが、型的な null 安全のため）。

### Step 3: 明度範囲の算出

```
minValue = min(parsed.map(p => p.parsed.value))
maxValue = max(parsed.map(p => p.parsed.value))
if (minValue > 0.5) minValue = 0.5  // 明度0.5を必ず含める
values = [minValue, minValue + 0.5, ..., maxValue]  // 0.5 刻み
```

### Step 4: 色相列の算出

```
hues = unique(parsed.filter(非無彩色).map(p => p.parsed.hue))
hueColumns = hues
  .map(h => ({ hue: h, rank: munsellHueRank(h) }))
  .sort((a, b) => a.rank - b.rank)
```

### Step 5: 各明度の彩度リスト算出

```
for v in values:
  chromas = unique(parsed.filter(p => p.value === v && !p.isNeutral).map(p => p.chroma))
  chromas.sort(asc)  // 彩度昇順、subrow index として利用
  valueRows[v] = { value: v, chromas }
```

### Step 6: セルの集約

同一マンセル値でグルーピング:

```
cellMap: Map<string, MapCell>  // key = munsell notation

for each jisColor:
  key = jisColor.munsell
  if cellMap.has(key):
    cellMap.get(key).colors.push(jisColor)
  else:
    cellMap.set(key, { kind: "jis", ..., colors: [jisColor] })

for each pccs in helpPccsList:
  key = pccs.munsell
  if cellMap.has(key) && cellMap.get(key).kind === "jis":
    cellMap.get(key).pccsHint = pccs
  else:
    cellMap.set(key, { kind: "pccs", ..., pccs })
```

### Step 7: 各セルの座標（列 × 値 × サブ行）割り当て

- 無彩色 JIS セル: `hueRank = null`（明度スケール列）、`chroma = null`
- 非無彩色セル: `hueRank = munsellHueRank(parsed.hue)`、`chroma = parsed.chroma`

サブ行インデックス: `valueRows[value].chromas.indexOf(chroma)` — 低彩度ほど上（小さいインデックス）。

## コンポーネント設計

### `components/jis-color-map/ValueSwatch.svelte`

```svelte
<script lang="ts">
  let { value, scale = 1 }: { value: number; scale?: number } = $props()
</script>

<div class="swatch" style="aspect-ratio: 1 / {scale};">
  <span>明度{value.toFixed(1)}</span>
</div>
```

- 角丸矩形、塗りなし、枠線 `var(--color-body)`、テキスト色 `var(--color-body)`
- `scale` による縦伸縮は `aspect-ratio` で表現（正方形 → `1/1`, 2倍縦伸び → `1/2`）

### `components/jis-color-map/JisColorSwatch.svelte`

```svelte
<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import type { JISColor } from "$lib/data/jis-colors"

  let {
    colors,
    pccsSymbol
  }: {
    colors: JISColor[] // 1件以上（同一マンセル値の慣用色）
    pccsSymbol?: string // 参考PCCS色記号（併記時のみ）
  } = $props()

  // 色は全て同一マンセル値 → 同一 hex なので先頭を使う
  const bgHex = $derived(colors[0].hex)
  const textColor = $derived(isLightColor(bgHex) ? "var(--color-body)" : "#fff")
  const fontSize = $derived(computeFontSize(colors))
</script>
```

- 塗り色 = `colors[0].hex`
- 複数の慣用色名を縦に並べて表示
- `nameSegments` がある場合は要素ごとに `<br>` で改行
- `pccsSymbol` が指定されていれば正方形の上に配置
- フォントサイズは最長名の文字数・色名の個数から `computeFontSize(colors)` で算出

### `components/jis-color-map/PccsSwatch.svelte`

```svelte
<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"

  let { pccs }: { pccs: PCCSColor } = $props()
  const symbol = $derived(PCCS_HUE_MAP.get(pccs.hueNumber!)!.symbol)
  const textColor = $derived(isLightColor(pccs.hex) ? "var(--color-body)" : "#fff")
  const fontSize = $derived(computeFontSize(symbol))
</script>

<div class="swatch" style="background: {pccs.hex}; color: {textColor};">
  <span style="font-size: {fontSize};">{symbol}</span>
</div>
```

- `border-radius: 50%` で円形
- `symbol` は `"1:pR"` のような形式（`PCCS_HUE_MAP` から取得）

### `components/jis-color-map/JisColorMap.svelte`

```svelte
<script lang="ts">
  import type { ColorFamily, ColorSubfamily } from "$lib/data/jis-colors"
  import { buildJisColorMap } from "$lib/jis-color-map/build-map"
  import ValueSwatch from "./ValueSwatch.svelte"
  import JisColorSwatch from "./JisColorSwatch.svelte"
  import PccsSwatch from "./PccsSwatch.svelte"

  let { groupId }: { groupId: ColorFamily | ColorSubfamily | "all" } = $props()
  const map = $derived(buildJisColorMap(groupId))
</script>

<div class="map-scroll">
  <div class="map" style="grid-template-columns: auto repeat({map.hueColumns.length}, ...);">
    <!-- 行: value 降順、各 value は chroma 数だけ subrow を持つ -->
    <!-- 列: 左端 = 明度スケール、以降 = hue 列 -->
    ...
  </div>
</div>
```

**レイアウト方針: CSS Grid**

- グリッドの各セルは 1 マス = スウォッチ1つ分の正方形
- 明度スウォッチ（明度スケール列）は `grid-row: span N`（N = その明度の chroma 数 = サブ行数）
- 慣用色スウォッチ・PCCS色スウォッチは 1x1 マス
- 等明度軸（value=0.5 の横列）は、chroma 数が 0 のときは列数分の明度スウォッチを並べる。色があればそれが置き換える
- 無彩色 JIS セルは明度スケール列に置かれ、明度スウォッチを置き換える（`grid-row: span N`）
- 画面幅が狭い場合の横スクロール: `.map-scroll { overflow-x: auto; }` + `.map { width: max-content; }`

### `lib/jis-color-map/build-map.ts`

マップ構築の中心ロジック。

```ts
export function buildJisColorMap(
  groupId: ColorFamily | ColorSubfamily | "all"
): JisColorMapData {
  const jisColors = getJisColorsByGroup(groupId)
  const subfamilies = getSubfamiliesByGroup(groupId)
  const hintRange = computeHintRange(subfamilies)
  const helpPccsList = PCCS_V24.filter(
    (p) => p.hueNumber! >= hintRange.from && p.hueNumber! <= hintRange.to
  )

  // ... Step 2 以降を実装
}
```

補助関数:

- `computeHintRange(subfamilies)` — from/to の min/max
- `collectValues(parsed)` — 明度集合
- `collectHueColumns(parsed)` — 色相列
- `collectChromas(parsed, value)` — 特定明度の彩度集合
- `groupCellsByMunsell(targetJis, helpPccsList)` — マンセル値でセルを集約

## 変更ファイル

### 新規

- `app/src/lib/jis-color-map/types.ts` — `JisColorMapData`, `MapCell`, `MapHueColumn`, `MapValueRow` など
- `app/src/lib/jis-color-map/build-map.ts` — `buildJisColorMap` 本体
- `app/src/lib/components/jis-color-map/JisColorMap.svelte`
- `app/src/lib/components/jis-color-map/ValueSwatch.svelte`
- `app/src/lib/components/jis-color-map/JisColorSwatch.svelte`
- `app/src/lib/components/jis-color-map/PccsSwatch.svelte`
- `app/src/routes/jis-color-map/+page.svelte`

### 更新

- `app/src/lib/color/munsell.ts`
  - `munsellHueRank(hue: string): number` を追加
  - ハル家族 → オフセットの定数マップを内部に持つ
- `app/src/lib/data/jis-colors.ts`
  - `getJisColorsByGroup(groupId)` — `"all"` / family / subfamily を統一的に扱う
  - `getSubfamiliesByGroup(groupId)` — groupId に属する `JISSubfamily` 配列を返す
  - `PCCS_V24` への参照は `lib/data/pccs.ts` から別途 export を追加するか、直接 JSON を import する
- `app/src/routes/+page.svelte`
  - `contents` 配列に `/jis-color-map` のエントリを追加
  - グラデーション / グロー色は既存と調和する値を選ぶ（例: `#f59f00` + `#c77dff`）
  - アイコンやタグ文言は「調べる」または「見る」系

### データソース補足

- `PCCS_V24` のエクスポート: `pccs.ts` で `export const PCCS_V24 = pccsV24 as PCCSColor[]` を追加するのがクリーン
- 型 `PCCSColor` は既に `munsell?: string` を持つが、v24 は全色 munsell あり。参照時は `p.munsell!` または null チェックで対応

## 影響範囲

- `ColorFamily` / `ColorSubfamily` / `JISColor` / `PCCSColor` 型は読み取りのみで変更なし
- `pccs.ts` に `PCCS_V24` を追加する変更は純粋な追加なので既存への影響なし
- 既存のスタイル変数（`--color-body`, `--color-heading`）を利用するため、`styles/global.css` などの変更は不要
- ルーティングに `/jis-color-map` が追加されるが、SvelteKit のファイルベースルーティングなので競合なし

## 再利用する既存資産

- `parseMunsell` (`lib/color/munsell.ts`) — マンセル表記パース
- `isLightColor` (`lib/color/utils.ts`) — 文字色分岐
- `PCCS_HUE_MAP` (`lib/data/pccs.ts`) — PCCS色相記号 `"1:pR"` 構築
- `JIS_COLORS_BY_GROUP` (`lib/data/jis-colors.ts`) — family/subfamily 単位取得のベース
- `JIS_COLOR_FAMILIES` — subfamily 列挙
- `Heading1` コンポーネント — ページ見出し

## スタイリング方針

`@css-styling-guideline` を遵守する前提で:

- カスタムプロパティ: マップのセルサイズ（`--cell-size: 64px` など）を `:root` もしくはマップコンポーネントで定義
- レスポンシブ: モバイルではセルサイズを小さめ（`48px`）に。ブレークポイントはプロジェクト既存値に合わせる
- 文字色は `isLightColor` で `var(--color-body)`（暗色） / `#fff`（明色）を切り替え（既存 `JisColorSwatch` は背景色判定）
- アクセシビリティ: スウォッチは視覚要素だが、`title` 属性で慣用色名・マンセル値をツールチップ表示

## エッジケース

| ケース | 挙動 |
| --- | --- |
| 特定の明度に色が1件もない（value=0.5 以外） | その値行は明度スウォッチのみ表示（chroma 数 = 0） |
| 全慣用色が明度0.5以上で、0.5 に色がない | 等明度軸は色相列数分の明度スウォッチで埋まる |
| 同一マンセル値の慣用色が3件以上 | 慣用色スウォッチ内で全件縦並び。フォントサイズは色名個数に応じて縮小 |
| 無彩色慣用色が複数 | 各明度に1個ずつ配置される想定。同一マンセル値なら同セルに統合 |
| 無彩色慣用色と非無彩色慣用色が同明度 | 無彩色は明度スケール列、非無彩色は対応するhue列。異なる列なので衝突しない |
| PCCS奇数色相のvトーンに munsell がない | `pccs_v24.json` は全色 munsell を持つため発生しない。型安全のため null なら helpPCCSList から除外 |

## オープンな判断事項（実装時に確定）

- セルサイズ（デスクトップ 64px / モバイル 48px を出発点に調整）
- ツールチップの表記フォーマット
- トップページ `/` 追加カードの glow 色・アイコン
- `computeFontSize` の具体ロジック（最長文字数から線形 / 階段的に調整）
