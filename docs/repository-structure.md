# リポジトリ構造定義書

## 全体構成

```
pccs-lens/                          リポジトリルート
├── app/                            SvelteKitアプリケーション本体
├── assets/                         ブランドアセット・デザインリソース
├── blog/                           ブログコンテンツ
├── docs/                           永続的ドキュメント
├── spec/                           spec-sparringで固めた機能単位の仕様
├── proto/                          プロトタイプ集
├── .claude/                        Claude Code設定
├── .github/                        GitHub Actions・設定
├── .steering/                      （旧）作業単位のステアリング記録。新規作成せず履歴として保持
├── .vscode/                        VSCode設定
├── .gitignore
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
│   │   │   ├── analyze.ts          配色分析ロジック
│   │   │   ├── analyze.spec.ts
│   │   │   ├── approximate.ts      PCCS近似（最近傍探索）
│   │   │   ├── approximate.spec.ts
│   │   │   ├── munsell.ts          マンセル色相表記の解析・色相ランク・5原色ラベル変換
│   │   │   └── utils.ts            色計算ユーティリティ
│   │   ├── components/             共通UIコンポーネント
│   │   │   ├── AnkiModeToggle.svelte          Ankiモード切替ボタン
│   │   │   ├── Breadcrumb.svelte              パンくずリスト
│   │   │   ├── ColorPicker.svelte             カラーピッカー＋HEX入力欄
│   │   │   ├── CopyButton.svelte              コピーボタン
│   │   │   ├── DraftTag.svelte                ドラフト表示用タグ
│   │   │   ├── Heading1.svelte                H1 見出し（アイコン付き）
│   │   │   ├── SwitchLightDark.svelte         ライト／ダーク切り替えボタン
│   │   │   ├── analyze/                       配色分析ページ専用コンポーネント
│   │   │   │   ├── ColorAnalysisResults.svelte
│   │   │   │   ├── ColorEntryItem.svelte
│   │   │   │   ├── ColorSchemePreview.svelte
│   │   │   │   ├── HueWheel.svelte
│   │   │   │   └── ToneDiagram.svelte
│   │   │   ├── jis-color-map/                 慣用色名マップページ専用コンポーネント
│   │   │   │   ├── ChromaCompareDiagram.svelte    彩度比較図（比較セクション用）
│   │   │   │   ├── CompactJisColorSwatch.svelte   ミニマップ用コンパクト慣用色スウォッチ
│   │   │   │   ├── FamilyCard.svelte              ファミリー別リンクカード
│   │   │   │   ├── HintJisColorSwatch.svelte      ミニマップ用参考慣用色スウォッチ（正六角形）
│   │   │   │   ├── HueCompareDiagram.svelte       色み比較図（比較セクション用）
│   │   │   │   ├── JisColorAllListCard.svelte     全一覧リンクカード（7色チェッカー模様）
│   │   │   │   ├── JisColorCompareSection.svelte  慣用色比較セクション本体
│   │   │   │   ├── JisColorDetailSection.svelte   慣用色名詳細セクション（全一覧ページ用）
│   │   │   │   ├── JisColorMap.svelte             慣用色名マップ
│   │   │   │   ├── JisColorNameTooltip.svelte     色名ポップオーバー（Popover API + Anchor Positioning）
│   │   │   │   ├── JisColorSwatch.svelte          慣用色スウォッチ
│   │   │   │   ├── JisExamLevelBadge.svelte       級タグバッジ（2級/3級）
│   │   │   │   ├── JisMiniColorMap.svelte         慣用色名ミニマップ（比較セクション内）
│   │   │   │   ├── PccsSwatch.svelte              PCCS色相ヒントスウォッチ
│   │   │   │   ├── ValueCompareDiagram.svelte     明度比較図（比較セクション用）
│   │   │   │   └── ValueSwatch.svelte             明度スウォッチ
│   │   │   ├── m-directive/                   Markdownカスタムディレクティブ用コンポーネント
│   │   │   │   ├── CardGrid.svelte
│   │   │   │   ├── ComingSoon.svelte
│   │   │   │   ├── DraftPageTitle.svelte
│   │   │   │   ├── Example.svelte
│   │   │   │   ├── GradeTag.svelte
│   │   │   │   ├── Mark.svelte
│   │   │   │   ├── MoreToCome.svelte
│   │   │   │   ├── Note.svelte
│   │   │   │   ├── PageLink.svelte
│   │   │   │   ├── TermCard.svelte
│   │   │   │   ├── Tips.svelte
│   │   │   │   └── WithGradeTag.svelte
│   │   │   ├── m-html/                        MarkdownのHTML要素置き換え用コンポーネント
│   │   │   │   ├── Heading2.svelte
│   │   │   │   ├── Heading3.svelte
│   │   │   │   ├── Heading4.svelte
│   │   │   │   ├── Olist.svelte
│   │   │   │   └── Ulist.svelte
│   │   │   └── patterns/                      配色パターンページ専用コンポーネント
│   │   │       ├── GeoPatternSection.svelte
│   │   │       ├── HueSelector.svelte
│   │   │       ├── ThemeColorPicker.svelte
│   │   │       ├── ThemeColorSchemePreview.svelte
│   │   │       └── ToneSelector.svelte
│   │   ├── data/                   JSONデータファイルと型定義
│   │   │   ├── jis-colors.ts       JIS慣用色名データアクセス
│   │   │   ├── jis_color_family.json  JIS慣用色ファミリー構造
│   │   │   ├── jis_colors.json     JIS慣用色名データ
│   │   │   ├── pccs-tone.ts        PCCSトーンデータアクセス
│   │   │   ├── pccs.ts             PCCSデータアクセス
│   │   │   ├── pccs_even12.json    偶数色相データ
│   │   │   ├── pccs_neutral.json   無彩色データ
│   │   │   ├── pccs_odd12.json     奇数色相データ
│   │   │   ├── pccs_s12.json       彩色12色相データ
│   │   │   ├── pccs_tone.json      トーンデータ
│   │   │   ├── pccs_v24.json       24色相データ
│   │   │   └── types.ts            共通型定義（PCCSColor等）
│   │   ├── demo/                   ガイド/色理論ページ用の図解デモコンポーネント
│   │   │   ├── PCCSColor.svelte
│   │   │   ├── SVGWrapper.svelte
│   │   │   ├── color-mixing/       混色の図解
│   │   │   │   ├── AddColorMixVenn.svelte
│   │   │   │   ├── MixingComplementary.svelte
│   │   │   │   ├── PrimaryColors.svelte
│   │   │   │   ├── PrimaryColorsCMY.svelte
│   │   │   │   ├── PrimaryColorsRGB.svelte
│   │   │   │   ├── PrimaryColorsWheel.svelte
│   │   │   │   ├── ReflectCMY.svelte
│   │   │   │   ├── ReflectRGB.svelte
│   │   │   │   └── SubColorMixVenn.svelte
│   │   │   ├── color-palette/      配色パレットの図解
│   │   │   │   ├── AnalyzedPalette.svelte
│   │   │   │   └── ColorPalettePreview.svelte
│   │   │   ├── hue-tone-diff/      色相/トーン差の図解
│   │   │   │   ├── ColorPaletteGrid.svelte
│   │   │   │   ├── ColorPaletteWithRandomNeutralPreview.svelte
│   │   │   │   ├── ColorPaletteWithRandomTonePreview.svelte
│   │   │   │   ├── HueBasedPalettePreview.svelte
│   │   │   │   ├── PCCSHueDiffWheel.svelte
│   │   │   │   └── ToneBasedPalettePreviewWithDiffMap.svelte
│   │   │   ├── pccs/               PCCSの図解
│   │   │   │   ├── PCCSHueWheel.svelte
│   │   │   │   ├── ToneAreaDiagram.svelte
│   │   │   │   ├── ToneImageDiagram.svelte
│   │   │   │   └── ToneValueCurveDiagram.svelte
│   │   │   └── spectrum/           スペクトラムの図解
│   │   │       ├── SpectrumGradient.svelte
│   │   │       └── SpectrumRange.svelte
│   │   ├── env.ts                  環境変数アクセス
│   │   ├── jis-color-map/          慣用色名マップ関連ロジック
│   │   │   ├── build-map.ts        マップデータ構築（マンセル値→グリッド配置元データ）
│   │   │   ├── compare.ts          比較セクション用データ生成（色相/明度/彩度の差分判定と図データ）
│   │   │   ├── family-checker.ts   ファミリーカード市松模様用2色ランダム選出
│   │   │   ├── family-copy.ts      ファミリー説明文辞書・代表HEX辞書
│   │   │   ├── layout.ts           マップのグリッドレイアウト計算（JisColorMap/JisMiniColorMapで共用）
│   │   │   ├── sort.ts             慣用色の並び順ロジック（マンセル色相順・明度降順・彩度降順）
│   │   │   ├── sort.spec.ts
│   │   │   └── types.ts            マップ関連の型定義
│   │   ├── layouts/                レイアウトコンポーネント
│   │   │   ├── guide-content.svelte    ガイドコンテンツページ用レイアウト
│   │   │   └── guide-map.svelte        ガイドマップページ用レイアウト
│   │   ├── meta/                   ページメタデータ
│   │   │   ├── grade.ts            級レベル定義
│   │   │   └── guide-pages.ts      ガイドページメタ情報
│   │   ├── patterns/               配色パターン関連ロジック
│   │   │   ├── checkerboard-rules.ts  チェッカーボードルール
│   │   │   ├── generators/         パターン生成
│   │   │   │   ├── bauhaus.ts
│   │   │   │   ├── geometric.ts
│   │   │   │   └── utils.ts
│   │   │   ├── lookup.ts           テーマ検索
│   │   │   ├── suggest.ts          配色サジェスト
│   │   │   ├── suggest.spec.ts
│   │   │   ├── themes.ts           テーマ定義
│   │   │   └── types.ts            配色パターン型定義
│   │   ├── remark/                 Remarkプラグイン
│   │   │   ├── custom-directives.d.ts
│   │   │   ├── custom-directives.js
│   │   │   ├── directive.js
│   │   │   ├── heading-title.js
│   │   │   └── mermaid.js
│   │   ├── state/                  グローバル状態管理（Svelte 5 rune）
│   │   │   ├── anki.svelte.ts      Ankiモード状態
│   │   │   └── lightMode.svelte.ts ライト／ダークモード状態
│   │   └── styles/                 グローバルスタイル
│   │       └── color.css           カラーテーマ変数
│   ├── routes/                     ページコンポーネント（SvelteKitルーティング）
│   │   ├── +layout.svelte          共通レイアウト（ナビゲーションバー）
│   │   ├── +layout.ts
│   │   ├── +page.svelte            トップページ（/）
│   │   ├── approximate/
│   │   │   ├── +page.svelte        機能1：色のPCCS近似（/approximate）
│   │   │   └── +page.ts
│   │   ├── analyze/
│   │   │   ├── +page.svelte        機能2：配色の分析（/analyze）
│   │   │   └── +page.ts
│   │   ├── color-fields/
│   │   │   └── +page.svx           色彩分野一覧ページ
│   │   ├── color-theory/           色理論ガイド（/color-theory/*）
│   │   │   ├── +page.svx
│   │   │   ├── bicolor-and-tricolor/+page.svx
│   │   │   ├── camaieu-and-faux-camaieu/+page.svx
│   │   │   ├── chevreul-color-harmony/+page.svx
│   │   │   ├── color-mixing-basics/+page.svx
│   │   │   ├── color-roles/+page.svx
│   │   │   ├── color-three-attributes/+page.svx
│   │   │   ├── color-wheel-based-color-schemes/+page.svx
│   │   │   ├── dominant-and-tone-on-tone/+page.svx
│   │   │   ├── electromagnetic-waves/+page.svx
│   │   │   ├── eye-structure/+page.svx
│   │   │   ├── gradient-color-scheme/+page.svx
│   │   │   ├── how-color-works/+page.svx
│   │   │   ├── hue-tone-difference/
│   │   │   │   ├── +page.svx
│   │   │   │   └── +page.ts
│   │   │   ├── light-path-through-the-retina/+page.svx
│   │   │   ├── natural-harmony/
│   │   │   │   ├── +page.svx
│   │   │   │   └── +page.ts
│   │   │   ├── pccs-basics/+page.svx
│   │   │   ├── pccs-color-system/+page.svx
│   │   │   ├── photoreceptor-types-and-distribution/+page.svx
│   │   │   ├── real-world-color-mixing/+page.svx
│   │   │   ├── tonal-color-scheme/+page.svx
│   │   │   ├── unity-and-variety/+page.svx
│   │   │   ├── visual-clarity-and-visibility/+page.svx
│   │   │   └── what-is-lighting/+page.svx
│   │   ├── jis-color-map/          機能4：慣用色名マップ（/jis-color-map）
│   │   │   ├── +page.svelte        ファミリー一覧ページ
│   │   │   ├── +page.ts
│   │   │   ├── [family]/
│   │   │   │   ├── +page.svelte    色みごとのマップページ（比較セクション含む）
│   │   │   │   └── +page.ts
│   │   │   └── all/
│   │   │       ├── +page.svelte    慣用色名 全一覧ページ（マンセル色相順）
│   │   │       └── +page.ts
│   │   └── patterns/
│   │       ├── +page.svelte        機能3：配色パターン一覧（/patterns）
│   │       └── [theme]/
│   │           ├── +page.svelte    機能3：テーマ別シミュレーター（/patterns/[theme]）
│   │           └── +page.ts
│   ├── app.d.ts                    SvelteKit型拡張
│   └── app.html                    HTMLテンプレート
├── scripts/                        開発用スクリプト
│   └── add-pccs-approximations.mjs
├── static/                         静的アセット（ビルド時にそのままコピー）
│   ├── .assetsignore
│   └── robots.txt
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
├── eslint.config.js                ESLint設定
├── package.json
├── package-lock.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── worker-configuration.d.ts       Cloudflare Workers型定義
└── wrangler.jsonc                  Cloudflare Wrangler設定
```

### ファイル配置ルール

- アプリケーションの各ページは`src/routes/`内に`+page.svelte`または`+page.svx`として実装する
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
├── architecture.md             技術仕様書
├── repository-structure.md     リポジトリ構造定義書（本ファイル）
├── development-guidelines.md   開発ガイドライン
├── domains/                    ドメイン用語・ルール定義
├── ideas/                      （旧）初期アイデア・検討資料。新規作成せず履歴として保持
└── .reviews/                   （旧）レビュー記録。新規作成せず履歴として保持
```

## protoディレクトリ

仕様やデザインの検討段階のプロトタイプ集。アプリケーション実装で直接使用されることはない。

```
proto/
├── geo-pattern-generator/      ジオメトリックパターン生成プロトタイプ
└── ui-patterns/                UIパターン検討プロトタイプ
```
