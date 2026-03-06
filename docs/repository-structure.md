# リポジトリ構造定義書

## 1. 全体構成

```
pccs-lens/                          リポジトリルート
├── app/                            SvelteKitアプリケーション本体
├── data/                           PCCSマスターデータ（CSV）
├── scripts/                        ユーティリティスクリプト
├── docs/                           永続的ドキュメント
├── .steering/                      作業単位のステアリングファイル
├── CLAUDE.md                       Claude向けプロジェクトメモリ
└── README.md                       プロジェクト概要
```

---

## 2. `data/` ディレクトリ

PCCSカラーデータのマスターCSVファイルを管理する。
アプリが直接読み込むのではなく、変換スクリプトにより `app/src/lib/data/` 配下のJSONを生成するための元データとして保持する。

```
data/
├── pccs_colors.csv         新配色カード199収録色（有彩色は偶数色相のみ＋無彩色）
├── pccs_colors_full.csv    全色相（24色相×全トーン＋無彩色）
└── jis_colors.csv          JIS慣用色名データ
```

**pccs_colors / pccs_colors_full のCSVフォーマット：** `[PCCS表記],[HEXコード]`（例：`v2,#EE0026`）

**jis_colors のCSVフォーマット：** `[慣用色名],[読み],[HEXコード],[出題級]`（例：`桜色,さくらいろ,#fdeeef,3`）

---

## 3. `scripts/` ディレクトリ

ユーティリティスクリプトを管理する。Node.js で直接実行する単独ファイルを配置し、外部依存は持たない。

```
scripts/
└── convert-csv-to-json.mjs    data/*.csv → app/src/lib/data/*.json 変換
```

実行方法・詳細は `docs/architecture.md` のセクション3を参照。

---

## 4. `app/` ディレクトリ

SvelteKitプロジェクトのルート。

```
app/
├── src/
│   ├── lib/                        再利用可能なロジック・コンポーネント
│   │   ├── color/                  色計算ロジック（UIに非依存の純粋関数）
│   │   │   ├── ciede2000.ts        CIEDE2000 色差計算
│   │   │   ├── convert.ts          HEX → sRGB → Lab 変換
│   │   │   └── approximate.ts      PCCS近似（最近傍探索）
│   │   ├── analysis/               配色分析ロジック（UIに非依存の純粋関数）
│   │   │   ├── hue.ts              色相関係・ハーモニー判定
│   │   │   ├── tone.ts             トーン関係判定
│   │   │   └── techniques.ts       配色技法判定
│   │   ├── data/                   JSONデータファイルと型定義
│   │   │   ├── types.ts            共通型定義（PCCSColor、ColorEntry等）
│   │   │   ├── pccs_colors.json    新配色カード199の色データ
│   │   │   ├── pccs_colors_full.json  全色相の色データ
│   │   │   └── jis_colors.json     JIS慣用色名データ
│   │   └── components/             共通UIコンポーネント
│   │       ├── ColorPicker.svelte  カラーピッカー＋HEX入力欄
│   │       ├── HueWheel.svelte     PCCS色相環（SVG）
│   │       └── ToneDiagram.svelte  PCCSトーン概念図（SVG）
│   ├── routes/                     ページコンポーネント（SvelteKitルーティング）
│   │   ├── +layout.svelte          共通レイアウト（ナビゲーションバー）
│   │   ├── +page.svelte            トップページ（/）
│   │   ├── approximate/
│   │   │   └── +page.svelte        機能1：色のPCCS近似（/approximate）
│   │   └── analyze/
│   │       └── +page.svelte        機能2：配色の分析と調整（/analyze）
│   ├── app.css                     グローバルスタイル
│   ├── app.d.ts                    SvelteKit型拡張
│   └── app.html                    HTMLテンプレート
├── static/                         静的アセット（ビルド時にそのままコピー）
│   └── favicon.png
├── tests/                          ブラウザ統合テスト（Playwright）
├── .eslint.config.js                    ESLint設定
├── .prettierrc                     Prettier設定
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 5. `docs/` ディレクトリ

アプリケーション全体の「何を作るか」「どう作るか」を定義する永続的ドキュメント。
基本設計が変わらない限り更新されない。

```
docs/
├── product-requirements.md     プロダクト要求定義書
├── functional-design.md        機能設計書
├── architecture.md             技術仕様書
├── repository-structure.md     リポジトリ構造定義書（本ファイル）
├── development-guidelines.md   開発ガイドライン
├── glossary.md                 ユビキタス言語定義
├── color-analysis-rules.md     色分析ルール定義書（PCCS判定ロジック詳細）
└── ideas/                      初期アイデア・検討資料（参照用）
    └── initial-requirements.md
```

---

## 6. `.steering/` ディレクトリ

特定の開発作業における「今回何をするか」を定義する作業単位のドキュメント。
作業ごとに新しいディレクトリを作成し、完了後も履歴として保持する。

```
.steering/
└── [YYYYMMDD]-[開発タイトル]/
    ├── requirements.md     今回の作業の要求内容
    ├── design.md           変更内容の設計
    └── tasklist.md         タスクリスト
```

---

## 7. ファイル配置ルール

### ロジックとUIの分離

- ビジネスロジック（色計算・配色分析）は `src/lib/color/` と `src/lib/analysis/` に配置し、`.ts` ファイルとして実装する
- UIコンポーネントは `src/lib/components/` に配置し、`.svelte` ファイルとして実装する
- ページ固有のロジックはページコンポーネント（`src/routes/`）内に記述する

### データファイル

- マスターデータ（CSV）は `data/` に配置する
- アプリが使用するJSONは `app/src/lib/data/` に配置する
- JSONは `data/*.csv` から変換スクリプトで生成し、手動編集しない

### テストファイル

- ユニットテスト（Vitest）はテスト対象ファイルと同じディレクトリに `*.spec.ts` として配置する
- ブラウザ統合テスト（Playwright）は `app/tests/` に配置する
