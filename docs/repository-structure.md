# リポジトリ構造定義書

## 全体構成

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

## appディレクトリ

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
│   │       ├── HueWheel.svelte     PCCS色相環（SVG・read-only）
│   │       ├── ToneDiagram.svelte  PCCSトーン概念図（SVG・read-only）
│   │       └── patterns/           F3専用UIコンポーネント
│   │           ├── HueWheelInput.svelte   インタラクティブ色相選択UI
│   │           └── ToneDiagramInput.svelte インタラクティブトーン選択UI
│   ├── routes/                     ページコンポーネント（SvelteKitルーティング）
│   │   ├── +layout.svelte          共通レイアウト（ナビゲーションバー）
│   │   ├── +page.svelte            トップページ（/）
│   │   ├── approximate/
│   │   │   └── +page.svelte        機能1：色のPCCS近似（/approximate）
│   │   ├── analyze/
│   │   │   └── +page.svelte        機能2：配色の分析と調整（/analyze）
│   │   └── patterns/
│   │       ├── +page.svelte        機能3：配色パターン一覧（/patterns）
│   │       └── [theme]/
│   │           └── +page.svelte    機能3：テーマ別シミュレーター（/patterns/[theme]）
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

### ファイル配置ルール

- アプリケーションの各ページは`src/routes/`内に`+page.svelte`ファイルとして実装する
  - SvelteKitのルーティング規約に準拠
- ビジネスロジックは `src/lib/`内に`.ts`ファイルとして実装する
  - 例外として、`svelte.config.js`で`import`されるファイルは`.js`ファイルとして実装する
- UIコンポーネントは `src/lib/components/` に配置し、`.svelte` ファイルとして実装する
  - 特定のページでしか使われないコンポーネントはサブディレクトリにまとめる
- ユニットテスト（Vitest）はテスト対象ファイルと同じディレクトリに `*.spec.ts` として配置する
- ブラウザ統合テスト（Playwright）は `app/tests/` に配置する

## docsディレクトリ

アプリケーション全体の「何を作るか」「どう作るか」を定義する永続的ドキュメント。

```
docs/
├── product-requirements.md     プロダクト要求定義書
├── functional-design.md        機能設計書
├── architecture.md             技術仕様書
├── repository-structure.md     リポジトリ構造定義書（本ファイル）
├── development-guidelines.md   開発ガイドライン
├── glossary.md                 ユビキタス言語定義
├── color-analysis-rules.md     色分析ルール定義書（PCCS判定ロジック詳細）
├── image-based-color-rules.md  イメージ別配色ルール定義書（F3テーマ別サジェスト条件）
└── ideas/                      初期アイデア・検討資料（参照用）
    ├── initial-requirements.md
    └── f3-mood-palette-patterns.md
```

## protoディレクトリ

仕様やデザインの検討段階のプロトタイプ集。アプリケーション実装で直接使用されることはない。

```
proto/

```
