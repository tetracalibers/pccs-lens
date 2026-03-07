# 機能設計書

## 1. システム構成

PCCS Lens はすべての処理をクライアントサイドで完結させるSPAとして構成する。
サーバーサイドは静的ファイル配信のみに留め、バックエンドAPIは持たない。

```
ブラウザ
├── SvelteKit（フロントエンド）
│   ├── ページ（F1・F2）
│   └── 色距離計算ロジック（CIEDE2000）
└── データ（JSONファイル・静的インポート）
    ├── app/src/lib/data/pccs_colors.json      (data/pccs_colors.csv から生成)
    ├── app/src/lib/data/pccs_colors_full.json (data/pccs_colors_full.csv から生成)
    └── app/src/lib/data/jis_colors.json       (data/jis_colors.csv から生成)
```

---

## 2. 画面遷移

```
トップページ（/）
├── 機能1：色のPCCS近似（/approximate）
└── 機能2：配色の分析と調整（/analyze）
```

- ナビゲーションバーで各機能ページに遷移できる
- 機能1の結果から機能2へ色を受け渡す際は `/analyze?color=RRGGBB` に遷移し、色が自動セットされる
  - `color` パラメータは `#` なしの6桁HEXコード（例：`/analyze?color=EE0026`）

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
| `closestPCCS` | `PCCSColor` | 最近傍PCCS値 |
| `isSelected` | `boolean` | 調整対象として選択中かどうか |

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
│   └── PCCSResultCard × N  色スウォッチ・PCCS表記・HEXコード・コピーボタン・「F2に送る」ボタン
├── JISColorFilter          JIS慣用色フィルタ（ラジオボタン）
└── JISColorResultList
    └── JISColorResultCard × N  色スウォッチ・慣用色名・読み・出題級
```

### ワイヤフレーム

```
┌─────────────────────────────────────┐
│  PCCS Lens        [近似] [配色分析]  │
├─────────────────────────────────────┤
│  色を入力                            │
│  ┌──────┐  #EE0026                  │
│  │      │  ──────────────           │
│  └──────┘  カラーピッカー            │
│                                      │
│  PCCSデータソース                     │
│  ● 新配色カード199  ○ すべての色     │
│                                      │
│  PCCS近似結果（上位8件）              │
│  ┌──────────────────────────────┐   │
│  │ ■  v2       [F2に送る]       │   │
│  │ ■  b2       [F2に送る]       │   │
│  │ ■  dp2      [F2に送る]       │   │
│  │  ...                          │   │
│  └──────────────────────────────┘   │
│                                      │
│  JIS慣用色名                         │
│  ● 3級  ○ 2級  ○ すべて           │
│                                      │
│  JIS慣用色近似結果（上位4件）         │
│  ┌──────────────────────────────┐   │
│  │ ■  朱色  しゅいろ     [3級]  │   │
│  │ ■  バーミリオン  vermilion    │   │
│  │  ...                          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 処理フロー

1. ユーザーがカラーピッカーまたはHEX入力で色を指定する
2. 選択中のPCCSデータソースCSVを参照し、全PCCS色とのΔE₀₀を計算する
3. ΔE₀₀の小さい順に上位8件をPCCS近似結果として表示する
4. 選択中のJIS慣用色フィルタに基づき `jis_colors.json` から対象色を絞り込む
5. 絞り込んだJIS慣用色とのΔE₀₀を計算し、上位4件をJIS慣用色近似結果として表示する
6. 「F2に送る」ボタン押下で `/analyze?color=RRGGBB`（入力色の6桁HEX）に遷移する

---

## 5. 機能2：配色の分析と調整（/analyze）

### コンポーネント構成

```
AnalyzePage
├── ColorEntryList              入力色リスト（最大6色）
│   └── ColorEntryRow × N      カラーピッカー・PCCS近似値・選択ボタン・削除ボタン
├── DiagramSection              色相環とトーン概念図のエリア
│   ├── HueWheel                PCCS色相環（SVG）
│   └── ToneDiagram             PCCSトーン概念図（SVG）
└── AnalysisSection             配色分析セクション
    ├── HueRelationItem         色相関係（2色時のみ）
    ├── ToneRelationItem        トーン関係（2色時のみ）
    ├── HarmonyItem             ハーモニー（2色時のみ）
    ├── ToneTechniqueList       色相・トーン軸の配色技法
    └── HueTechniqueList        色相環分割の配色技法
```

### ワイヤフレーム

```
┌──────────────────────────────────────────────┐
│  PCCS Lens              [近似] [配色分析]     │
├──────────────────────────────────────────────┤
│  入力色                              [色を追加]│
│  ┌────────────────────────────────────────┐  │
│  │ [●選択] ■ #EE0026  →  v2   [削除]     │  │
│  │ [ 選択] ■ #3A6BB4  →  d18  [削除]     │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │              │  │                      │  │
│  │   色相環     │  │    トーン概念図       │  │
│  │  （SVG）     │  │      （SVG）          │  │
│  │              │  │                      │  │
│  └──────────────┘  └──────────────────────┘  │
│                                               │
│  配色の分析                                   │
│  ┌────────────────────────────────────────┐  │
│  │ 色相関係：対照色相                      │  │
│  │ トーン関係：対照トーン                  │  │
│  │ 配色技法：ビコロール                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### HueWheel（色相環）の仕様

- 24色相を円形に配置したSVGで描画する
- 各セクターは対応するPCCS代表色で塗りつぶす
- 色相番号と色相名（例：`1:pR`）を外周に表示する
- 入力色のPCCS近似値の色相に対応するセクターをハイライト表示する
  - 無彩色に近似された入力色はハイライトしない
- 調整対象の色が選択されている状態でセクターをクリックすると、その色の色相が変わる

### ToneDiagram（トーン概念図）の仕様

- 有彩色トーンをグリッド状に配置したSVGで描画する
- 各セルは対応するトーンの代表色（または複数色のグラデーション）で塗りつぶし、トーン記号を表示する
- 無彩色（W/ltGy/mGy/dkGy/Bk）は概念図の左端の列に配置する
- 入力色のPCCS近似値のトーンに対応するセルをハイライト表示する
- 調整対象の色が選択されている状態でセルをクリックすると、その色のトーンが変わる

### インタラクティブ調整のフロー

1. ユーザーが入力色リストの「選択」ボタンで調整対象の色を1色選ぶ
2. 色相環のセクターをクリック → その色の色相番号が更新される
3. トーン概念図のセルをクリック → その色のトーン記号が更新される
4. 色相とトーンが確定したPCCS値に対応する代表HEXコードを表示・プレビューに反映する
5. 分析セクションの判定結果がリアルタイムで更新される

### 処理フロー（初期表示）

1. ユーザーがカラーピッカーで色を追加する（最大6色）
2. 追加のたびに `pccs_colors.json` を参照してΔE₀₀で最近傍PCCS値を決定する
3. 色相環・トーン概念図・分析セクションをすべて更新する

### 処理フロー（F1からの遷移）

機能1の「F2に送る」ボタン経由で遷移した場合の初期化フロー。

1. ページマウント時に `$page.url.searchParams.get('color')` で `color` パラメータを読み取る
2. 値が存在し有効な6桁HEXコードであれば、先頭に `#` を付与して `ColorEntry` を1件生成する
3. `pccs_colors.json` を参照してΔE₀₀で最近傍PCCS値を決定し、`closestPCCS` にセットする
4. `history.replaceState` でURLから `color` パラメータを除去する（URL汚染を防ぐ）
5. 色相環・トーン概念図・分析セクションを更新する
6. `color` パラメータが存在しない・不正値の場合は通常の空状態で表示する（エラー表示なし）
