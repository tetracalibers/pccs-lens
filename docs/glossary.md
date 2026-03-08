# ユビキタス言語定義

本ドキュメントは、PCCS Lens の開発において使用するドメイン用語・UI用語・コード命名を統一するための定義集。
ドキュメント・コード・コミットメッセージすべてで一貫して使用する。

---

## 1. PCCSドメイン用語

| 日本語 | 英語（コード上の命名） | 定義 |
|---|---|---|
| PCCS | PCCS | Practical Color Co-ordinate System。日本色研配色体系 |
| 色相 | hue | PCCSの24色相（1:pR〜24:RP）。無彩色には存在しない |
| 色相番号 | hueNumber | 色相を表す整数（1〜24） |
| 色相名 | hueName | 色相番号に対応する名称（例：`2:R`、`8:Y`） |
| トーン | tone | 明度と彩度を組み合わせた色調区分（v/b/dp/lt/sf/d/dk/p/ltg/g/dkg） |
| トーン記号 | toneSymbol | トーンを表す短縮記号（例：`v`、`sf`、`dkg`） |
| 無彩色 | neutral | 色相を持たない色（白・グレー・黒）。コード上は `isNeutral: true` |
| 有彩色 | chromatic | 色相を持つ色。コード上は `isNeutral: false` |
| 無彩色区分 | achromaticBucket | トーン概念図上での無彩色の区分（`W`/`ltGy`/`mGy`/`dkGy`/`Bk`） |
| PCCS値 | pccsNotation / notation | PCCS表記（例：`v2`、`Gy-5.0`、`W`） |
| 代表HEX | hex | PCCSの各値に対応するHEXカラーコード |
| 新配色カード199 | — | 日本色研が発行する配色カード。`pccs_colors.csv` の収録範囲 |
| 色相差 | hueDifference | 24色相環上の最短距離（0〜12） |

### 色相関係

| 日本語 | 英語（コード上の命名） | 色相差 |
|---|---|---|
| 同一色相 | `same` | 0 |
| 隣接色相 | `adjacent` | 1 |
| 類似色相 | `similar` | 2〜3 |
| 中差色相 | `intermediate` | 4〜7 |
| 対照色相 | `contrasting` | 8〜10 |
| 補色色相 | `complementary` | 11〜12 |

### トーン関係

| 日本語 | 英語（コード上の命名） | 条件 |
|---|---|---|
| 同一トーン | `same` | 完全一致 |
| 類似トーン | `similar` | 概念図上で8方向隣接 |
| 対照トーン | `contrasting` | 同一・類似以外 |

### トーン概念図の列

| 列 | 英語（コード上の命名） | 含まれるトーン |
|---|---|---|
| 1列目（最高彩度） | column1 | `v` |
| 2列目 | column2 | `b`, `dp` |
| 3列目 | column3 | `lt`, `sf`, `d`, `dk` |
| 4列目（最低彩度） | column4 | `p`, `ltg`, `g`, `dkg` |

### ハーモニー

| 日本語 | 英語（コード上の命名） | 条件 |
|---|---|---|
| ナチュラルハーモニー | `natural` | 黄側の色が紫側の色より高明度トーン |
| コンプレックスハーモニー | `complex` | 紫側の色が黄側の色より高明度トーン |

---

## 2. 配色技法

### 色相・トーンを軸とした技法

| 日本語 | 英語（コード上の命名） |
|---|---|
| ドミナントカラー | `dominantColor` |
| ドミナントトーン（トーンイントーン） | `dominantTone` |
| トーンオントーン | `toneOnTone` |
| トーナル | `tonal` |
| カマイユ | `camaieu` |
| フォカマイユ | `fauxtCamaieu` |
| ビコロール | `bicolor` |
| トリコロール | `tricolor` |

### 色相環分割による技法

| 日本語 | 英語（コード上の命名） |
|---|---|
| ダイアード | `dyad` |
| トライアド | `triad` |
| スプリットコンプリメンタリー | `splitComplementary` |
| テトラード | `tetrad` |
| ペンタード | `pentad` |
| ヘクサード | `hexad` |

---

## 3. アプリケーション用語

| 日本語 | 英語（コード上の命名） | 定義 |
|---|---|---|
| 入力色 | colorEntry | ユーザーが機能2に入力した1色分のデータ |
| 近似結果 | approximationResult | 入力色に対してΔE₀₀が小さい順に並んだPCCS値のリスト |
| 最近傍PCCS値（不変） | approximatedPCCS | 入力HEXに対してCIEDE2000で1番目に近いPCCS値。入力HEX変更時のみ再計算される |
| 代替候補PCCS値 | alternatePCCS | 入力HEXに対してCIEDE2000で2〜3番目に近いPCCS値のペア。入力HEX変更時にリセットされる |
| 選択済みPCCS値 | selectedPCCS | ApproximationSectionでの代替候補選択後のPCCS値。デフォルトは `approximatedPCCS` |
| 表示用PCCS値 | displayedPCCS | VisualizationSection・AnalysisSectionの分析・プレビューに使われる最終的なPCCS値。`selectedPCCS` にAdjustmentSectionの調整を適用した結果 |
| 履歴エントリ | historyEntry | 特定操作時点の `inputHexList`・`displayedPCCSList`・`summary` をまとめた1件の履歴データ |
| 履歴スタック | historyStack | `historyEntry` を最大20件保持するスタック構造のデータ |
| 色距離 | colorDifference / deltaE | CIEDE2000で計算した知覚的色差（ΔE₀₀） |
| 配色分析 | colorSchemeAnalysis | 入力色群の色相関係・トーン関係・ハーモニー・技法を判定した結果 |
| データソース | dataSource | PCCS近似の検索対象となるデータセット（`card199` / `full`） |

---

## 4. UI用語

| 画面上の表示 | コード上の命名 | 定義 |
|---|---|---|
| 色相環 | HueWheel | PCCS 24色相を円形に配置したSVG図（VisualizationSection内・read-only） |
| トーン概念図 | ToneDiagram | PCCSトーンをグリッド状に配置したSVG図（VisualizationSection内・read-only） |
| 小型色相環 | MiniHueWheel | AdjustmentSectionの個別調整内に配置する小型のPCCS色相環SVG。セクターをクリックして色相を選択する |
| 代替候補エリア | AlternateCandidates | ApproximationSectionの各色入力UIに表示するPCCS代替候補スウォッチ×2のエリア |
| 配色プレビュー | ColorSchemePreview | VisualizationSectionの「入力色」「PCCS近似色」2行の色スウォッチ列 |
| 履歴サイドバー | HistorySidebar | 全セクションの左に設置する開閉可能な配色履歴の一覧パネル |
| 分析カード | AnalysisCard | AnalysisSectionの配色特徴・技法をカードUIとして表示するコンポーネント（タイトル・解説・カテゴリタグ） |
| 色スウォッチ | colorSwatch | 色を視覚的に示す正方形の色見本 |
| カラーピッカー | ColorPicker | 色を選択するUI（`input[type=color]`＋HEX入力欄） |
| 近似ページ | ApproximatePage | 機能1のページ（`/approximate`） |
| 分析ページ | AnalyzePage | 機能2のページ（`/analyze`） |

---

## 5. ファイル・データ関連

| 用語 | 定義 |
|---|---|
| `pccs_colors.csv` | 新配色カード199収録色のマスターCSV（有彩色は偶数色相のみ＋無彩色） |
| `pccs_colors_full.csv` | 全色相（24色相×全トーン＋無彩色）のマスターCSV |
| `jis_colors.csv` | JIS慣用色名のマスターCSV（慣用色名・読み・HEXコード・出題級） |
| `pccs_colors.json` | `pccs_colors.csv` から生成したJSONデータ（アプリが使用） |
| `pccs_colors_full.json` | `pccs_colors_full.csv` から生成したJSONデータ（アプリが使用） |
| `jis_colors.json` | `jis_colors.csv` から生成したJSONデータ（アプリが使用） |
