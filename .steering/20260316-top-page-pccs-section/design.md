# 設計：トップページにPCCSの解説セクションを追加

## 実装アプローチ

### 新規ファイル

```
app/src/lib/components/index/
  ToneImageDiagram.svelte     # インタラクティブなトーン概念図
  ToneAreaDiagram.svelte  # ハイライト付きトーン概念図
```

`app/src/routes/+page.svelte` に解説セクションを追加する。

---

## `ToneImageDiagram.svelte`

### SVGレイアウト

`ToneDiagram.svelte` と同じトーンセル配置（CELLS定数の座標構造）を踏襲しつつ、セル半径を大きくする。

**セルサイズ定数：**

```
PIE_OUTER_R = 36    // パイスライスの外側半径
PIE_INNER_R = 15    // パイスライスの内側半径（ドーナツ穴）
LABEL_R     = 44    // 色相番号テキストの中心半径
CELL_R      = 50    // セル全体の占有半径（間隔計算用）
RECT_W      = 90    // 無彩色セルの幅
RECT_H      = 60    // 無彩色セルの高さ
ROW_STEP    = 108   // 縦方向のセル間距離
COL_GAP     = 14    // 有彩色列間の間隔
COL_GAP_ACH = 20    // 無彩色列と有彩色1列目の間隔
```

### 色相環の描画（chromatic セル）

偶数色相番号（2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24）の12色スライスをSVGの `<path>` で描画する。

**スライス描画：**
- 各スライスの中心角: 360° / 12 = 30°
- 開始角度: PCCSの色相1（赤）が上に来るよう -90° オフセット
- パスの形状: `M inner arc outer arc close`
- 塗りつぶし色: `pccs_colors_full.json` から対象 toneSymbol + hueNumber の hex

**中央テキスト：**
- toneSymbol（太字）+ 改行 + toneNameEn（小文字）
- フォント: `var(--font-mono)`

**色相番号ラベル：**
- 各スライス中心角方向、`LABEL_R` の位置に小さいテキスト
- font-size: 8px

**無彩色セル（square）：**
- 矩形の中央に toneSymbol と toneNameEn を表示（ToneDiagram.svelte と同様）
- W → 白背景、Gy 系 → グレー背景（Gy-5.0 の hex）、Bk → 黒背景

### 軸の描画

セル群の範囲全体にわたる軸を SVG 内に描画する：

- **横軸（彩度）**: セル群の下端を横断する水平矢印
  - x 始点: Col0（無彩色セル）の左端付近（SVG 左端まで）
  - x 終点: Col4（v セル）の右端付近（SVG 右端まで）
  - 「薄い」ラベルを左端（矢印の反対端）に表示
  - 「彩度」ラベルを軸の中央（下側）に表示
  - 「鮮やか」ラベルを右端（矢印ヘッド側）に表示
- **縦軸（明度）**: セル群の左端を縦断する垂直矢印
  - y 始点: 最下段セルの下端付近（SVG 下端まで）
  - y 終点: 最上段セルの上端付近（SVG 上端まで）
  - 「暗い」ラベルを下端（矢印の反対端）に表示
  - 「明度」ラベルを軸の中央（左側）に表示、テキストは縦書き（`writing-mode` または `transform rotate`）
  - 「明るい」ラベルを上端（矢印ヘッド側）に表示
- 軸の線色: `#aaa`、線幅: 1px、端ラベルのフォントサイズ: 10px

### ツールチップ

- hover（pointerenter/pointerleave）で `pccs_tone.json` の `feelings` 配列をカンマ区切りでツールチップ表示
- ツールチップデザインは ToneDiagram.svelte に準じる

### Props

なし（全データを内部で保持）

---

## `ToneAreaDiagram.svelte`

### SVGレイアウト

`ToneDiagram.svelte` の CELLS 定数・座標定数をほぼそのまま流用する。
ただし：
- `s` トーンのハッチング・特別表示ロジックを削除し、他の chromatic トーンと同様に扱う
- インタラクション（hover/tooltip）は持たない

### Props

```typescript
highlights: string[]  // pccs_tone.json の toneSymbol 配列
```

### ハイライト判定

各セルが `highlights` に含まれるかの判定：

| セルのキー | highlights 内の対応シンボル |
|-----------|---------------------------|
| `W`       | `"W"`                     |
| `ltGy`    | `"Gy"`                    |
| `mGy`     | `"Gy"`                    |
| `dkGy`    | `"Gy"`                    |
| `Bk`      | `"Bk"`                    |
| その他     | toneSymbol そのまま        |

### 塗りつぶし色

ハイライトセルの fill：
- chromatic トーン: `pccs_colors_full.json` の `{toneSymbol}12` の hex（色相12:G）
- `W`: `#f1f1f1`
- `Gy`: グレー（`Gy-5.0` の `#797979`）
- `Bk`: `#252525`

非ハイライトセルの表示：
- fill: `white`（もしくは transparent）
- opacity: `0.25`
- stroke: `#ccc`
- テキスト: `#ccc`

### 軸の描画

ToneImageDiagram と同じ仕様で彩度横軸・明度縦軸を表示する（セル群の幅・高さ全体にわたる矢印線）。

---

## `+page.svelte` への追加

`<nav class="feature-nav">` の直後に以下の構造でセクションを追加する。
`main` 要素の `text-align: center` スタイルは維持しつつ、解説文は `text-align: left` のラッパーで囲む。

```
<section class="pccs-guide">
  <h2>PCCSとは？</h2>
  ...説明文...
  <ToneImageDiagram />

  <h2>色の分類</h2>
  <h3>純色</h3>
  <ToneAreaDiagram highlights={["v"]} />

  <h3>明清色</h3>
  <ToneAreaDiagram highlights={["p", "lt", "b"]} />

  ...（暗清色、中間色、無彩色）
</section>
```

---

## 影響範囲

- 変更: `app/src/routes/+page.svelte`（解説セクション追加）
- 新規: `app/src/lib/components/index/ToneImageDiagram.svelte`
- 新規: `app/src/lib/components/index/ToneAreaDiagram.svelte`
- 既存コンポーネントへの変更なし
