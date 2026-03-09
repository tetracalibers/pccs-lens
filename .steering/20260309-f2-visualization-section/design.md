# 設計：F2 セクション2（配色プレビュー・色相環・トーン概念図）

## 実装アプローチ

3つの新規コンポーネントを作成し、`/analyze` ページに `VisualizationSection` として組み込む。

---

## 変更するファイル一覧

| 種類 | ファイル | 変更内容 |
|---|---|---|
| 新規 | `app/src/lib/components/ColorSchemePreview.svelte` | 配色プレビューコンポーネント |
| 新規 | `app/src/lib/components/HueWheel.svelte` | PCCS色相環SVGコンポーネント |
| 新規 | `app/src/lib/components/ToneDiagram.svelte` | PCCSトーン概念図SVGコンポーネント |
| 変更 | `app/src/routes/analyze/+page.svelte` | ColorEntry型更新・VisualizationSection追加 |

---

## データ構造の変更

### ColorEntry への `displayedPCCS` 追加

```typescript
// 変更前
type ColorEntry = {
  id: string
  inputHex: string
  selectedPCCS: PCCSColor
  alternatePCCS: [PCCSColor, PCCSColor]
}

// 変更後
type ColorEntry = {
  id: string
  inputHex: string
  selectedPCCS: PCCSColor
  alternatePCCS: [PCCSColor, PCCSColor]
  displayedPCCS: PCCSColor  // 追加: 現時点では selectedPCCS と同値
}
```

`makeEntry()` で `displayedPCCS: results[0].color` を追加。
`onSelectAlternate()` で `displayedPCCS: alternate` を追加。

---

## コンポーネント設計

### 1. ColorSchemePreview.svelte

**役割**: 入力色・PCCS近似色の2行スウォッチ表示

**Props**:
```typescript
{
  inputHexList: string[]       // 入力色のhex配列
  displayedPCCSList: PCCSColor[] // 近似色配列
}
```

**レイアウト**:
```
入力色：    [■40px][■][■]...
PCCS近似色：[■40px][■][■]...
```

- 各行に左ラベル（`入力色` / `PCCS近似色`）と正方形スウォッチを並べる
- スウォッチサイズ: 40×40px、border-radius: 4px
- スウォッチ間ギャップ: 6px

---

### 2. HueWheel.svelte

**役割**: 24色相を円環状に配置したread-only SVG

**Props**:
```typescript
{
  displayedPCCSList: PCCSColor[]
  techniqueHighlightHues?: number[] | null  // セクション3実装時用（今回は未使用・null固定）
}
```

**SVG仕様**:
- `viewBox="0 0 320 320"`, width/height はCSSで制御
- 中心: (160, 160)
- 外径 R: 110px
- 内径 r: 28px（ドーナツ穴）
- セクターごとの角度: 15° (= 360° / 24)
- 開始角度: 色相1が真上（-90°）から時計回り

**各セクターのパス計算**:
```typescript
// 色相h (1-24) のセクター
const startDeg = (h - 1) * 15 - 90
const endDeg = startDeg + 15
// SVGのarcコマンドで扇形リング（ドーナツ切片）を描画
```

**セクターの塗り色（代表色マップ）**:

vトーンの代表色をセクターの塗り色として使用（定数として埋め込み）:
```typescript
const HUE_COLORS: Record<number, string> = {
  1:"#D40045", 2:"#EE0026", 3:"#FD1A1C", 4:"#FE4118", 5:"#FF590B",
  6:"#FF7F00", 7:"#FFCC00", 8:"#FFE600", 9:"#CCE700", 10:"#99CF15",
  11:"#66B82B", 12:"#33A23D", 13:"#008F62", 14:"#008678", 15:"#007A87",
  16:"#055D87", 17:"#093F86", 18:"#0F218B", 19:"#1D1A88", 20:"#281285",
  21:"#340C81", 22:"#56007D", 23:"#770071", 24:"#AF0065"
}
```

**色相名マップ**:
```typescript
const HUE_NAMES: Record<number, string> = {
  1:"pR", 2:"R", 3:"yR", 4:"rO", 5:"O", 6:"yO",
  7:"rY", 8:"Y", 9:"gY", 10:"YG", 11:"yG", 12:"G",
  13:"bG", 14:"BG", 15:"GB", 16:"gB", 17:"B", 18:"B",
  19:"pB", 20:"V", 21:"bP", 22:"P", 23:"rP", 24:"RP"
}
```

**近似色ハイライト**:
- `displayedPCCSList` から `hueNumber != null`（有彩色）のものを抽出
- 該当セクターに `stroke="#222" stroke-width="2.5"` を追加
- ハイライトなしセクター: `stroke="none"` or `stroke="#fff" stroke-width="0.5"` (セクター境界を薄く)
- 中心から各ハイライトセクターの中央角へ方向線を描画:
  - 線: `(160, 160)` → `(160 + R * cos(midAngle), 160 + R * sin(midAngle))`
  - スタイル: `stroke="white" stroke-width="1.5" opacity="0.8"`

**技法範囲ハイライト** (`techniqueHighlightHues` が渡された場合・今回は未実装):
- 対象セクター: 半透明の強調色で塗り直す
- 近似色ハイライトの opacity を 0.4 に下げる

**ラベル表示**:
- 外径より外側 (labelR = 135px) に各色相の `h:name` ラベルを表示
- `text-anchor="middle"`, `font-size="8"`, `fill="#555"`
- 角度によってラベルが180°反転しないよう、SVG `textPath` または固定 `text` 要素で対応
- ラベル数が多いためデフォルトは偶数色相のみ表示（奇数は省略可）

**インタラクション**: `pointer-events: none`

---

### 3. ToneDiagram.svelte

**役割**: PCCSトーンをグリッド配置したSVG＋ツールチップ

**Props**:
```typescript
{
  displayedPCCSList: PCCSColor[]
  isCard199: boolean               // trueのとき sトーンを非収録表示
  techniqueHighlightTones?: string[] | null  // セクション3実装時用（今回は null）
}
```

**グリッドレイアウト**:

列構成（左→右 = 彩度低→高）:

| 列 | 種別 | トーン（上→下 = 明→暗） | セル形状 |
|---|---|---|---|
| Col 0（無彩色） | achromatic | W, ltGy, mGy, dkGy, Bk | 正方形 |
| Col 1 | chromatic | p, ltg, g, dkg | 円形 |
| Col 2 | chromatic | lt, sf, d, dk | 円形 |
| Col 3 | chromatic | b, s, dp | 円形 |
| Col 4 | chromatic | v（1つのみ） | 円形 |

**縦位置：段階的 midpoint 配置**

各列の y 座標は、左隣の列の連続する2セルの中間に配置する（縦中央揃え）。

アルゴリズム:
- Col 0（5項目）: 等間隔に配置（ステップ = 50px）
- Col 1（4項目）: Col 0 の隣接ペア間の midpoint
- Col 2（4項目）: Col 0 の隣接ペア間の midpoint（Col 1 と同一 y）
- Col 3（3項目）: Col 1（= Col 2）の隣接ペア間の midpoint
- Col 4（1項目、v）: Col 3 の中央アイテム（s）と同じ y

**SVG寸法**:
```
viewBox="0 0 300 250"
Col0 step: 50px（隣接セルの y 間距離）
円半径: 20px
正方形: 36×36px

y positions (各セルの center):
  Col 0: y = 25, 75, 125, 175, 225
  Col 1: y = 50, 100, 150, 200      ← Col0 ペアの midpoint
  Col 2: y = 50, 100, 150, 200      ← Col1 と同一
  Col 3: y = 75, 125, 175           ← Col1 ペアの midpoint
  Col 4: y = 125                    ← Col3[1]（s）と同一

x positions (各列の center):
  Col 0: x = 26
  Col 1: x = 94   (Col0右端 52 + gap16 + 26)
  Col 2: x = 154  (94 + 52 + 8)
  Col 3: x = 214  (154 + 52 + 8)
  Col 4: x = 274  (214 + 52 + 8)
```

**セル配置テーブル（y, x）**:

```
  y\Col   Col0(x=26)  Col1(x=94)  Col2(x=154)  Col3(x=214)  Col4(x=274)
  y=25    W
  y=50                p           lt
  y=75    ltGy                                  b
  y=100               ltg         sf
  y=125   mGy                                   s            v
  y=150               g           d
  y=175   dkGy                                  dp
  y=200               dkg         dk
  y=225   Bk
```

ユーザー指定の例との一致確認:
- p(y=50) は W(y=25) と ltGy(y=75) の中間 ✓
- b(y=75) は lt(y=50) と sf(y=100) の中間 ✓
- v(y=125) は s(y=125) と同じ高さ ✓

**セルの描画ルール**:

```typescript
type ToneCell = {
  key: string          // トーン記号 or achromaticBucket
  label: string        // 表示ラベル
  cx: number           // x中心座標
  cy: number           // y中心座標
  shape: 'circle' | 'square'
  usedColors: PCCSColor[]  // この cell に対応する displayedPCCS の一覧（0件 = 未使用）
}
```

- **未使用トーン** (`usedColors.length === 0`):
  - fill: `"white"` (または `"transparent"`)
  - stroke: `"#ccc"`, stroke-width: `"1"`
  - ラベルテキスト: `fill="#bbb"`

- **使用中トーン** (`usedColors.length >= 1`):
  - fill: `usedColors[0].hex` （複数色でも先頭1色で塗りつぶし）
  - stroke: `"#333"`, stroke-width: `"3"`
  - ラベルテキスト: `fill` は塗り色に応じて白/黒を選択（輝度判定）
  - ツールチップ: hover時に全 `usedColors` の `notation + hex` を表示（詳細は下記）

**どのセルに usedColors を割り当てるか**:

```typescript
// 有彩色: toneSymbol で一致
// 無彩色: achromaticBucket で一致
function getUsedColors(cell: ToneCell, displayedPCCSList: PCCSColor[]): PCCSColor[] {
  return displayedPCCSList.filter(c => {
    if (c.isNeutral) return c.achromaticBucket === cell.key
    return c.toneSymbol === cell.key
  })
}
```

**sトーンの特別表示** (`isCard199 === true` のとき):
- SVG `<defs>` に斜線パターンを定義:
  ```xml
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="8" stroke="#ccc" stroke-width="2"/>
  </pattern>
  ```
- sトーンセル: fill=`"url(#hatch)"`, opacity=`"0.5"`, ラベル color=`"#aaa"`
- `isCard199 === false`（すべての色モード）のとき: 通常の未使用/使用中ルールを適用

**ツールチップ実装**:

SVG 内の `<title>` 要素ではなく、Svelte のリアクティブ state + HTML オーバーレイを使用する。
Pointer Events API（`PointerEvent`）の `pointerType` でマウスとタッチを一元的に処理する。

```typescript
type TooltipState = {
  visible: boolean
  x: number        // SVGコンテナ相対のpx位置
  y: number
  colors: PCCSColor[]
}
let tooltip: TooltipState = $state({ visible: false, x: 0, y: 0, colors: [] })
```

**イベント戦略**（Pointer Events 統一）:

| イベント | 処理 |
|---|---|
| `pointerenter` | ツールチップ表示（マウス・タッチ共通） |
| `pointerleave` | `pointerType === 'mouse'` のときのみ非表示。タッチは無視（指を離してもツールチップ維持） |
| `document` の `pointerdown` | ツールチップ表示中、別の場所をタップ/クリックしたら非表示（タッチの dismiss 用） |

SVG 各セルにイベントハンドラを付与:
```svelte
<circle
  onpointerenter={(e) => showTooltip(e, cell)}
  onpointerleave={(e) => { if (e.pointerType === 'mouse') hideTooltip() }}
  style="touch-action: none"
  ...
/>
```

```typescript
function showTooltip(e: PointerEvent, cell: ToneCell) {
  const rect = wrapperEl.getBoundingClientRect()
  tooltip = {
    visible: true,
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    colors: cell.usedColors
  }
}

function hideTooltip() {
  tooltip = { ...tooltip, visible: false }
}

// ツールチップ表示中に外側をタップ/クリックしたら閉じる
$effect(() => {
  if (!tooltip.visible) return
  function onOutsidePointer(e: PointerEvent) {
    if (!wrapperEl.contains(e.target as Node)) hideTooltip()
  }
  document.addEventListener('pointerdown', onOutsidePointer)
  return () => document.removeEventListener('pointerdown', onOutsidePointer)
})
```

HTML オーバーレイ（SVGの兄弟要素）:
```svelte
<div class="diagram-wrapper" bind:this={wrapperEl}>
  <svg ...>...</svg>
  {#if tooltip.visible}
    <div class="tooltip" style="left:{tooltip.x}px; top:{tooltip.y}px">
      {#each tooltip.colors as c}
        <div class="tooltip-row">
          <span class="tooltip-swatch" style="background:{c.hex}"></span>
          <span class="tooltip-notation">{c.notation}</span>
          <span class="tooltip-hex">{c.hex}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

ツールチップは使用中トーン（`usedColors.length >= 1`）を持つセルでのみ表示。

**インタラクション**: クリック・タップによる色変更なし。ツールチップの表示のみ許可。

---

## VisualizationSection（analyze/+page.svelte への追加）

```svelte
<section class="visualization-section">
  <h2>配色の確認</h2>

  <ColorSchemePreview
    inputHexList={entries.map(e => e.inputHex)}
    displayedPCCSList={entries.map(e => e.displayedPCCS)}
  />

  <div class="diagrams">
    <HueWheel
      displayedPCCSList={entries.map(e => e.displayedPCCS)}
    />
    <ToneDiagram
      displayedPCCSList={entries.map(e => e.displayedPCCS)}
      isCard199={true}
    />
  </div>
</section>
```

`.diagrams` は横並び（flex）。レスポンシブで縦並びに切り替え。

---

## ラベルの輝度判定（テキスト色の白/黒切り替え）

トーンセルのラベルテキスト色は塗り色の輝度に応じて自動選択する:

```typescript
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // 相対輝度（簡易版）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
// true → テキスト黒 (#333), false → テキスト白 (#fff)
```

---

## 影響範囲の分析

- 既存コンポーネント（ColorPicker, ColorEntryItem など）は変更しない
- `ColorEntry` 型の `displayedPCCS` 追加は page.svelte ローカルの変更であり、他ページへの影響なし
- 新規コンポーネントは `$lib/components/` に追加するだけで既存コードに影響なし
