# 設計：F3-5 幾何パターン画像の生成・プレビュー・保存

## 実装アプローチ

### 色変更時の「色だけ置き換え」の実現方法

#### 検討した手法

色変更時に形状を保ったまま色のみ更新する方法として、以下の3手法を検討した。

**A. シードベースRNG再生成**
- パターン生成を決定論的にするため `mulberry32` 等の PRNG を導入し、シードを保持する
- 色変更時 = 同じシードで再生成 → 同じ形状・異なる色
- **コスト**：svg.js が DOM 要素を毎回フルに再構築する（Bauhaus は clipPath 付き要素 30〜40 個、Geometric は三角形パス 200 個）
- **複雑さ**：PRNG 実装・シード管理・ライフサイクル制御が煩雑になる

**B. SVG 文字列の単一パス正規表現置換**
- 生成時に使用した 3 色 `[c0, c1, c2]` を保持し、色変更時は SVG 文字列内の hex を正規表現で一括置換する
- **コスト**：SVG 文字列（数KB）に対する文字列処理のみ → ほぼゼロ
- **安全性**：1 回の `replace` で全 hex を同時置換するため、`c0→c1` のような交差汚染が起きない
- **シンプルさ**：PRNG 不要、ジェネレーターは `Math.random()` のまま移植できる

```ts
function updateSvgColors(
  svg: string,
  oldColors: [string, string, string],
  newColors: [string, string, string]
): string {
  const map = new Map(oldColors.map((c, i) => [c.toLowerCase(), newColors[i].toLowerCase()]))
  return svg.replace(/#[0-9a-f]{6}/gi, m => map.get(m.toLowerCase()) ?? m)
}
```

svg.js の出力する `d` パス属性の数値（例：`M 150,50`）は `#rrggbb` の形式に該当しないため、意図しない置換が起きるリスクは実用上なし。

**C. SVG DOM 属性操作**
- SVG DOM ノードを保持し、`querySelectorAll` + `fill` 属性書き換えで更新
- コストは B より高く、`{@html}` でレンダリング済みの DOM への操作が必要で実装が複雑

#### 採用手法：B（SVG 文字列の単一パス正規表現置換）

**採用理由**：実行コストが最も低く、実装が最もシンプル。PRNG 不要になることで、ジェネレーターの移植コストも下がる。

- 「色変更」= `updateSvgColors()` による文字列置換（DOM 操作なし）
- 「画像を再生成」= `Math.random()` ベースで通常の再生成

### ブラウザ互換ジェネレーターの実装方針

protoの `utils.ts` は `svgdom` + Node.js fs に依存しているため、ブラウザ環境では使用不可。

`app/src/lib/patterns/generators/` 以下に、以下の方針でブラウザ互換版を作成する：

- `svgdom` / `registerWindow` を除去し、`@svgdotjs/svg.js` の `SVG()` をブラウザDOMで直接使用
- `rand` / `pick` は `Math.random()` ベースのまま移植（シードRNG 不要）
- プロト版のジェネレーター関数（`drawShape`、主ループ）のロジックはそのまま移植

## 変更するコンポーネント・ファイル

### 新規作成ファイル

```
app/src/lib/patterns/generators/
  bauhaus.ts                  ← ブラウザ互換バウハウスジェネレーター
  geometric.ts                ← ブラウザ互換ジオメトリックジェネレーター

app/src/lib/components/patterns/
  GeoPatternSection.svelte    ← 幾何パターンセクション（両パターン＋ボタン）
```

### 変更するファイル

```
app/src/routes/patterns/[theme]/+page.svelte
  ← GeoPatternSection を追加（配色プレビューの直下に配置）
```

## 各ファイルの設計詳細

### `generators/bauhaus.ts`

```ts
// 3色 → SVG文字列
export function generateBauhaus(colors: [string, string, string]): string
```

protoの `generateBauhaus` の実装を移植。`rand` / `pick` は `Math.random()` ベースのままとし、`createCanvas` はブラウザ用に `SVG().size(300, 300)` を直接呼ぶ。

### `generators/geometric.ts`

```ts
// 3色 → SVG文字列
export function generateGeometric(colors: [string, string, string]): string
```

protoの `generateGeometric` を同様に移植。

### `GeoPatternSection.svelte`

#### Props

```ts
interface Props {
  colors: [string, string, string]  // [base, assort, accent] or [base, base, assort]
  themeId: string                   // PNG命名用
}
```

#### 状態管理

```ts
// バウハウス
let bauhausSvg      = $state('')
let bauhausColors   = $state<[string, string, string] | null>(null) // 生成時の色（置換用）
let bauhausLoading  = $state(false)

// ジオメトリック
let geometricSvg     = $state('')
let geometricColors  = $state<[string, string, string] | null>(null)
let geometricLoading = $state(false)
```

#### 初期生成 + 色変更時の更新

```ts
import { browser } from '$app/environment'

$effect(() => {
  if (!browser) return
  const c = colors // リアクティブ依存（色変更を検知）

  if (bauhausColors === null) {
    // 初期生成
    bauhausSvg    = generateBauhaus(c)
    bauhausColors = c
  } else if (!bauhausLoading) {
    // 色変更 → 文字列置換で更新
    bauhausSvg    = updateSvgColors(bauhausSvg, bauhausColors, c)
    bauhausColors = c
  }
  // ジオメトリックも同様
})
```

- `bauhausColors === null` のとき（初回のみ）フル生成を行う
- 以降の色変更は `updateSvgColors()` による文字列置換で対応（DOM 操作なし）
- ローディング中に色変更された場合、`bauhausLoading = false` 後に `$effect` が再実行され最新の色で置換される

#### 再生成フロー

```ts
async function regenerateBauhaus() {
  bauhausLoading = true
  await tick()                          // ローディング表示を先に反映
  bauhausSvg    = generateBauhaus(colors)
  bauhausColors = colors                // 置換基準色を更新
  bauhausLoading = false
}
```

#### PNG保存フロー

SVG文字列 → `<img>` で読み込み → `<canvas>` に描画 → `toBlob` → `<a download>` でクリック

```ts
async function downloadPng(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await new Promise(r => (img.onload = r))

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 300
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)

  canvas.toBlob(blob => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob!)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }, 'image/png')
}
```

#### レイアウト（HTML構造）

```html
<section class="geo-patterns">
  <h2>幾何パターン</h2>
  <div class="patterns-grid">

    <!-- バウハウス -->
    <div class="pattern-card">
      <h3>バウハウス</h3>
      <div class="pattern-preview">
        {#if bauhausLoading}
          <div class="loading-overlay">...</div>
        {/if}
        {@html bauhausSvg}
      </div>
      <div class="pattern-actions">
        <button disabled={bauhausLoading} onclick={regenerateBauhaus}>
          画像を再生成
        </button>
        <button disabled={!bauhausSvg} onclick={...}>
          PNG保存
        </button>
      </div>
    </div>

    <!-- ジオメトリック（同様） -->

  </div>
</section>
```

### `[theme]/+page.svelte` の変更

#### カラー引数の計算

```ts
const geoColors = $derived<[string, string, string]>(
  showAccent && accentPCCS
    ? [basePCCS.hex, assortPCCS.hex, accentPCCS.hex]
    : [basePCCS.hex, basePCCS.hex, assortPCCS.hex]
)
```

#### GeoPatternSection の追加

```svelte
<GeoPatternSection colors={geoColors} themeId={theme.id} />
```

配色プレビューセクション（`.preview-section`）の直後に配置する。

## データ構造の変更

なし（既存の `basePCCS` / `assortPCCS` / `accentPCCS` の `.hex` を使用）。

## 影響範囲の分析

| 範囲 | 影響 |
|---|---|
| `app/src/routes/patterns/[theme]/+page.svelte` | `GeoPatternSection` の import と追加のみ |
| 他のF3コンポーネント（HueSelector, ToneSelector, etc.） | 変更なし |
| F1・F2 機能 | 変更なし |
| `app/package.json` | 変更なし（`@svgdotjs/svg.js` は既にインストール済み） |

## 注意事項

- `@svgdotjs/svg.js` の `SVG()` はブラウザDOMを使用するため、`$effect` 内の `browser` ガードに限定する。
- `canvas.toBlob` を使ったPNG変換はブラウザ環境のみで動作する（SSRなし）。
- ローディング中のUIは、パターン部分のみオーバーレイ表示とし、他のUI（色選択など）は操作可能なままとする。
- `updateSvgColors()` の hex 置換は単一パス（`String.replace` 1回）で行い、複数色の交差汚染を防ぐ。
- 2色以上のロールが同じ HEX になるケースでも置換は冪等（結果が変わらない）なため問題なし。
