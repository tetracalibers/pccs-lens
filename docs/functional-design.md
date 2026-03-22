# 機能設計書

## 1. システム構成

PCCS Lens はすべての処理をクライアントサイドで完結させるSPAとして構成する。
サーバーサイドは静的ファイル配信のみに留め、バックエンドAPIは持たない。

```
ブラウザ
├── SvelteKit（フロントエンド）
└── データ（JSONファイル・静的インポート）
```

---

## 2. 画面遷移

```
トップページ（/）
├── 機能1：色のPCCS近似（/approximate）
├── 機能2：配色の分析と調整（/analyze）
└── 機能3：イメージ別配色シミュレータ（/patterns）
    └── テーマ別シミュレーター（/patterns/[theme]）
```

- ナビゲーションバーで各機能ページに遷移できる

---

## 3. データモデル

### PCCSColor

CSVから読み込んだ1件のPCCS色を表す。

| フィールド | 型 | 説明 |
|---|---|---|
| `notation` | `string` | PCCS表記（例：`v2`、`Gy-5.0`、`W`） |
| `hex` | `string` | 代表HEXコード（例：`#EE0026`） |
| `toneSymbol` | `string \| null` | トーン記号（例：`v`、`sf`）。無彩色はnull |
| `hueNumber` | `number \| null` | 色相番号（1〜24）。無彩色はnull |
| `isNeutral` | `boolean` | 無彩色かどうか |
| `achromaticBucket` | `AchromaticBucket \| null` | 無彩色のバケット区分（有彩色はnull） |

```typescript
type AchromaticBucket = 'W' | 'ltGy' | 'mGy' | 'dkGy' | 'Bk';
```

### JISColor

`jis_colors.json` から静的インポートした1件のJIS慣用色を表す。

| フィールド | 型 | 説明 |
|---|---|---|
| `name` | `string` | 慣用色名（例：`朱色`、`バーミリオン`） |
| `reading` | `string` | 読み（和色名はふりがな、外来色名は英語名） |
| `hex` | `string` | HEXコード（例：`#e94709`） |
| `examLevel` | `2 \| 3 \| null` | 出題級（3：3級、2：2級、null：出題級なし） |

---

### ColorEntry（機能2の入力色1件）

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 識別用ID |
| `inputHex` | `string` | ユーザーが入力したHEXコード |
| `alternatePCCS` | `[PCCSColor, PCCSColor]` | CIEDE2000 2〜3番目の代替候補（ΔE₀₀昇順・入力HEX変更時リセット） |
| `selectedPCCS` | `PCCSColor` | 分析・プレビューに使われるPCCS値（デフォルトはCIEDE2000 1番目） |

- 入力色（HEX）が変わると：CIEDE2000で再計算し、`selectedPCCS`・`alternatePCCS` をリセットする
- 代替候補を選択すると：`selectedPCCS` を更新する

---

### AnalysisResult（機能2の分析結果）

| フィールド | 型 | 説明 |
|---|---|---|
| `hueRelation` | `HueRelation \| null` | 色相関係（2色時のみ） |
| `toneRelation` | `ToneRelation \| null` | トーン関係（2色時のみ） |
| `harmony` | `Harmony \| null` | ハーモニー（2色時のみ） |
| `toneTechniques` | `ToneTechnique[]` | 当てはまる色相・トーン軸の配色技法（0件以上） |
| `hueTechniques` | `HueTechnique[]` | 当てはまる色相環分割の配色技法（0件以上） |

```typescript
// 色相関係（color-analysis-rules.md §6 より）
type HueRelation = 'same' | 'adjacent' | 'similar' | 'intermediate' | 'contrasting' | 'complementary';

// トーン関係（color-analysis-rules.md §7 より）
type ToneRelation = 'same' | 'similar' | 'contrasting';

// ハーモニー（color-analysis-rules.md §9 より）
type Harmony = 'natural' | 'complex';

// 色相・トーン軸の配色技法（color-analysis-rules.md §8-1 より）
type ToneTechnique =
  | 'dominantColor'
  | 'dominantTone'
  | 'toneOnTone'
  | 'tonal'
  | 'camaieu'
  | 'fauxtCamaieu'
  | 'bicolor'
  | 'tricolor';

// 色相環分割による配色技法（color-analysis-rules.md §8-2 より）
type HueTechnique =
  | 'dyad'
  | 'triad'
  | 'splitComplementary'
  | 'tetrad'
  | 'pentad'
  | 'hexad';
```

---


## 4. 機能1：色のPCCS近似（/approximate）

### コンポーネント構成

```
ApproximatePage
├── ColorPickerInput        カラーピッカー＋HEX入力欄
├── PCCSDataSourceFilter    PCCSデータソースフィルタ（ラジオボタン）
├── PCCSResultList
│   └── PCCSResultCard × N  色スウォッチ・PCCS表記・HEXコード・コピーボタン
└── JISColorResultList
    └── JISColorResultCard × N  色スウォッチ・慣用色名・読み・出題級
```

### 処理フロー

1. ユーザーがカラーピッカーまたはHEX入力で色を指定する
2. 選択中のPCCSデータソースCSVを参照し、全PCCS色とのΔE₀₀を計算する
3. ΔE₀₀の小さい順に上位6件をPCCS近似結果として表示する
4. `jis_colors.json` の全JIS慣用色とのΔE₀₀を計算し、上位6件をJIS慣用色近似結果として表示する

---

## 5. 機能2：配色の分析と調整（/analyze）

### コンポーネント構成

```
AnalyzePage
├── ApproximationSection        カラーコード入力とPCCS近似色の編集
│   ├── PCCSDataSourceFilter    データソースフィルタ（F1と共通）
│   └── ColorEntryList          入力色リスト（2〜6色・横並び）
│       └── ColorEntryItem × N
│           ├── ColorPickerInput     カラーピッカー＋HEX入力欄・削除ボタン
│           ├── PCCSApproxPreview    近似色スウォッチ＋PCCS表記
│           └── AlternateCandidates  代替候補スウォッチ×2＋PCCS表記
├── VisualizationSection        配色プレビューと色相環・トーン概念図
│   ├── ColorSchemePreview      配色プレビュー（入力色・PCCS近似色の2行）
│   ├── HueWheel                PCCS色相環（SVG・read-only）
│   └── ToneDiagram             PCCSトーン概念図（SVG・read-only）
└── AnalysisSection             配色分析結果
    └── AnalysisCard × N       タイトル・解説・カテゴリタグ
```

### HueWheel（色相環）の仕様

- 24色相を円形に配置したSVGで描画する
- 各セクターは対応するPCCS代表色で塗りつぶす
- 色相番号と色相名（例：`1:pR`）を外周に表示する
- 有彩色の `displayedPCCS` の色相セクターに枠線を追加し彩度を高めた色で塗り直す。複数色は複数セクターを同時にハイライト。色相環の中心から各近似色の色相セクターへ方向線を描画する。無彩色の近似色はハイライトしない
- インタラクションは持たない（read-only）

### ToneDiagram（トーン概念図）の仕様

- PCCSトーンをグリッド状に配置したSVGで描画する
- 各セルはトーン記号ラベルを表示し、対応するトーンの代表色で塗りつぶす
- 列構成（左から）：
  - 1列目：無彩色（W/ltGy/mGy/dkGy/Bk）を正方形セルで縦中央寄せ
  - 2列目：p/ltg/g/dkg（円形セル）
  - 3列目：lt/sf/d/dk（円形セル）
  - 4列目：b/s/dp（円形セル）
  - 5列目：v（円形セル）
  - 各列の円・正方形は縦中央に寄せて配置する
- `displayedPCCS` で使われているトーンのセルに枠線を追加し彩度を高めた色で塗り直す
- sトーンの表示：「新配色カード199にある色」フィルタ選択時は低彩度・低不透明度＋斜線パターンで非収録であることを示す。「すべての色」フィルタ選択時は通常表示する
- インタラクションは持たない（read-only）

### 状態管理フロー

各入力色の `displayedPCCS` は以下の優先順で決定する：

```
CIEDE2000 1番目（入力HEX変更時のみ再計算）
  ↓ ApproximationSectionでの代替候補選択
selectedPCCS（VisualizationSection・AnalysisSectionに反映される最終値）
```

### 処理フロー（初期表示）

1. ユーザーがカラーピッカーで色を追加する（最大6色）
2. 追加のたびに選択中のPCCSデータソースを参照してΔE₀₀で上位3件のPCCS近傍色を決定する
3. 1番目を `selectedPCCS`・`displayedPCCS` に設定し、2〜3番目を `alternatePCCS` に設定する
4. HueWheel・ToneDiagram・AnalysisSectionをすべて更新する

---

## 6. 機能3：イメージ別配色シミュレータ（/patterns, /patterns/[theme]）

### データモデル

#### ThemeColorScheme（テーマの選択中配色）

| フィールド | 型 | 説明 |
|---|---|---|
| `baseColor` | `SelectedColor` | ベースカラーの選択値 |
| `assortColor` | `SelectedColor` | アソートカラーの選択値 |
| `accentColor` | `SelectedColor \| null` | アクセントカラーの選択値。非表示の場合は `null` |

```typescript
interface SelectedColor {
  hueNumber: number | null; // null = 無彩色
  toneSymbol: string;       // トーン記号（例: 'p', 'ltGy', 'Bk'）
  hex: string;              // 対応するHEXコード
  notation: string;         // PCCS表記（例: 'v2', 'ltGy'）
}
```

面積比率はテーマの種別と `accentColor` の有無によって決まる（詳細は `docs/image-based-color-rules.md §1-6`）。

---

### コンポーネント構成

#### 配色パターン一覧ページ（/patterns）

```
PatternsPage
└── ThemeCard × N         各テーマへのリンクカード
    ├── CheckeredPreview  ベース・アソートカラーの2×2市松模様プレビュー（SVG）
    ├── ThemeName         テーマ名（例：エレガント）
    └── ThemeMood         イメージキーワード（例：「女性的な」「気品のある」…）
```

#### テーマ別シミュレーターページ（/patterns/[theme]）

```
PatternSimulatorPage
├── ThemeDescription      テーマのイメージ・配色ルール解説
├── ColorSchemePreview    配色プレビュー（面積比率に応じた色スウォッチ列）
│   └── SwatchItem × N   色スウォッチ + PCCS表記 + HEXコードコピーボタン
├── ColorInputSection     色選択エリア
│   ├── ColorInputGroup   （ベースカラー用）
│   │   ├── HueWheelInput     インタラクティブ色相選択UI
│   │   └── ToneDiagramInput  インタラクティブトーン選択UI
│   ├── ColorInputGroup   （アソートカラー用）
│   │   ├── HueWheelInput
│   │   └── ToneDiagramInput
│   ├── ColorInputGroup   （アクセントカラー用・追加後に表示）
│   │   ├── HueWheelInput
│   │   └── ToneDiagramInput
│   └── AddAccentButton   「アクセントカラーを追加する」ボタン
└── PatternSection        幾何パターン生成エリア
    ├── PatternCard       （バウハウス・パターン）
    │   ├── SVG           バウハウスパターン画像
    │   ├── RegenerateButton  「画像を再生成」ボタン
    │   └── SaveButton    「PNG保存」ボタン
    └── PatternCard       （ジオメトリック・パターン）
        ├── SVG           ジオメトリックパターン画像
        ├── RegenerateButton
        └── SaveButton
```

---

### HueWheelInput の仕様

`HueWheel.svelte`（read-only）をベースに、色相選択のインタラクションを追加した専用コンポーネント。

- 奇数番号の色相も偶数番号と同様に表示する
- 円周沿いに全色相の円形色スウォッチを配置し、クリックで色相を選択する
  - サジェスト対象外のスウォッチは視覚的に目立たない状態で表示する（クリックは可能）
- サジェストされる色相の扇形は塗りつぶし、それ以外の扇形は区切り線のみ表示する
- 色相を選択したら、その円形色スウォッチの枠線が太くなり、扇形にも枠線を描画し、それ以外の色相は不透明度が下がる
- 他の色相をクリックして選択し直しが可能
- トーン選択UIで選択したトーンが変わると、扇形塗りつぶしの色・円形スウォッチの色もそのトーンの色に変化する
- 無彩色トーン選択時の挙動：`docs/image-based-color-rules.md §1-9` を参照

---

### ToneDiagramInput の仕様

`ToneDiagram.svelte`（read-only）をベースに、トーン選択のインタラクションを追加した専用コンポーネント。

- サジェストされるトーンのセルは塗りつぶし、それ以外のセルは視覚的に目立たない状態で表示する（クリックは可能）
- トーンのセルをクリックするとそのトーンが選択状態になる
- 選択したセルの枠線が太くなり、それ以外のセルは不透明度が下がる
- 他のトーンをクリックして選択し直しが可能
- 色相選択UIで選択した色相が変わると、セルの塗りつぶしの色もその色相の色に変化する
- グレイ系トーン（ltGy/mGy/dkGy）のホバー時にツールチップが表示され、細かいグレイ値（`Gy-2.5` 〜 `Gy-8.5`）を選択できる

---

### 処理フロー

#### 初期表示

1. テーマIDからサジェスト条件を取得する（`docs/image-based-color-rules.md §4-3` 参照）
2. ベースカラー → アソートカラーの順にサジェスト内からランダムに初期値を決定する
3. 配色プレビューを初期値で描画する
4. `onMount` でバウハウス・パターンとジオメトリック・パターンを生成する（SSR非対応のため）

#### 色変更時

1. 変更された色に応じてアソートカラー / アクセントカラーのサジェストをリアルタイム更新する（選択値はリセットしない）
2. 配色プレビューをリアルタイム更新する
3. 幾何パターンは模様（図形配置・乱数シード）を保持したまま、色のみ置き換える（再生成は行わない）

#### 画像保存

SVGを `canvas.drawImage` + `canvas.toBlob` + `a[download]` 方式でPNGに変換し、`[theme]-[pattern-type].png` のファイル名でダウンロードする。

