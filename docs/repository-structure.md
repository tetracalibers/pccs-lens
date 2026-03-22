# リポジトリ構造定義書

## 全体構成

```
pccs-lens/                          リポジトリルート
├── app/                            SvelteKitアプリケーション本体
├── blog/                           ブログコンテンツ
├── docs/                           永続的ドキュメント
├── proto/                          プロトタイプ集
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
│   │   ├── assets/                 静的アセット（アイコン等）
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── favicon.ico
│   │   │   └── icon.svg
│   │   ├── color/                  色計算ロジック（UIに非依存の純粋関数）
│   │   │   ├── ciede2000.ts        CIEDE2000 色差計算
│   │   │   ├── ciede2000.spec.ts
│   │   │   ├── convert.ts          HEX → sRGB → Lab 変換
│   │   │   ├── convert.spec.ts
│   │   │   ├── approximate.ts      PCCS近似（最近傍探索）
│   │   │   ├── approximate.spec.ts
│   │   │   ├── analyze.ts          配色分析ロジック
│   │   │   ├── analyze.spec.ts
│   │   │   └── validate.ts         入力バリデーション
│   │   ├── components/             共通UIコンポーネント
│   │   │   ├── ColorAnalysisResults.svelte  配色分析結果表示
│   │   │   ├── ColorEntryItem.svelte        色エントリーアイテム
│   │   │   ├── ColorPicker.svelte           カラーピッカー＋HEX入力欄
│   │   │   ├── ColorSchemePreview.svelte    配色プレビュー
│   │   │   ├── CopyButton.svelte            コピーボタン
│   │   │   ├── HueWheel.svelte              PCCS色相環（SVG・read-only）
│   │   │   ├── ToneDiagram.svelte           PCCSトーン概念図（SVG・read-only）
│   │   │   └── guide/                       ガイドページ専用コンポーネント
│   │   │       ├── ToneAreaDiagram.svelte
│   │   │       └── ToneImageDiagram.svelte
│   │   ├── data/                   JSONデータファイルと型定義
│   │   │   ├── types.ts            共通型定義（PCCSColor、ColorEntry等）
│   │   │   ├── pccs.ts             PCCSデータアクセス
│   │   │   ├── pccs_even12.json    偶数色相データ
│   │   │   ├── pccs_odd12.json     奇数色相データ
│   │   │   ├── pccs_s12.json       彩色12色相データ
│   │   │   ├── pccs_v24.json       24色相データ
│   │   │   ├── pccs_neutral.json   無彩色データ
│   │   │   ├── pccs_tone.json      トーンデータ
│   │   │   └── jis_colors.json     JIS慣用色名データ
│   │   ├── layouts/                レイアウトコンポーネント
│   │   │   └── guide.svelte
│   │   ├── patterns/               配色パターン関連ロジック
│   │   │   ├── types.ts            配色パターン型定義
│   │   │   ├── themes.ts           テーマ定義
│   │   │   ├── lookup.ts           テーマ検索
│   │   │   ├── suggest.ts          配色サジェスト
│   │   │   ├── suggest.spec.ts
│   │   │   ├── checkerboard-rules.ts  チェッカーボードルール
│   │   │   └── generators/         パターン生成
│   │   │       ├── bauhaus.ts
│   │   │       ├── geometric.ts
│   │   │       └── utils.ts
│   │   ├── remark/                 Remarkプラグイン
│   │   │   ├── custom-directives.d.ts
│   │   │   ├── custom-directives.js
│   │   │   └── directive.js
│   │   └── index.ts                lib公開エントリーポイント
│   ├── routes/                     ページコンポーネント（SvelteKitルーティング）
│   │   ├── +layout.svelte          共通レイアウト（ナビゲーションバー）
│   │   ├── +layout.ts
│   │   ├── +page.svelte            トップページ（/）
│   │   ├── approximate/
│   │   │   └── +page.svelte        機能1：色のPCCS近似（/approximate）
│   │   ├── analyze/
│   │   │   ├── +page.svelte        機能2：配色の分析（/analyze）
│   │   │   └── +page.ts
│   │   ├── guide/
│   │   │   └── +page.svx           ガイドページ（/guide）
│   │   └── patterns/
│   │       ├── +page.svelte        機能3：配色パターン一覧（/patterns）
│   │       └── [theme]/
│   │           ├── +page.svelte    機能3：テーマ別シミュレーター（/patterns/[theme]）
│   │           └── +page.ts
│   ├── app.d.ts                    SvelteKit型拡張
│   └── app.html                    HTMLテンプレート
├── static/                         静的アセット（ビルド時にそのままコピー）
│   └── robots.txt
├── eslint.config.js                ESLint設定
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── worker-configuration.d.ts       Cloudflare Workers型定義
└── wrangler.jsonc                  Cloudflare Wrangler設定
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
├── architecture.md             技術仕様書
├── repository-structure.md     リポジトリ構造定義書（本ファイル）
├── development-guidelines.md   開発ガイドライン
├── domains/                    ドメイン用語・ルール定義
│   ├── glossary.md             ユビキタス言語定義
│   ├── color-analysis-rules.md 色分析ルール定義書（PCCS判定ロジック詳細）
│   └── image-based-color-rules.md  イメージ別配色ルール定義書（F3テーマ別サジェスト条件）
├── ideas/                      初期アイデア・検討資料（参照用）
└── .reviews/                   レビュー記録（参照用）
```

## protoディレクトリ

仕様やデザインの検討段階のプロトタイプ集。アプリケーション実装で直接使用されることはない。

```
proto/
└── geo-pattern-generator/      ジオメトリックパターン生成プロトタイプ
```
