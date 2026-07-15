# Color Prism

## コンテンツ開発

### 記事ページの作成・執筆

記事は「CG・画像処理」「色の理論」「色の活用分野」の3種類があり、いずれも次の流れで作成する。

1. **雛形の作成**：一覧の下書きリンクから雛形ページ（`+page.svx`）を起こす。記事の種類に応じたスキルにページタイトルを渡す。
   - CG・画像処理：`/create-cg-page`
   - 色の理論：`/create-color-theory-page`
   - 色の活用分野：`/create-color-fields-page`
2. **草稿の執筆**：`/author-style-writer <slug>` で、本文の草稿を著者らしい文体で執筆する（スキルの引数の詳細は後述）。
3. **編集・手直し**：`/author-style-writer <slug> <編集指示>` で、すでに本文のあるページに編集を加える（スキルの引数の詳細は後述）。

> [!IMPORTANT]
> 執筆した記事は、次のコミットメッセージ規約に従ってコミットする。`author-style-analyzer` が Git 履歴から「AI草稿 → 人手編集」の差分（`refine-style.md`）を追跡するのに使うため、この規約を守る。
>
> - AIに書かせた初稿は`<title> [ai-draft]`でコミットする
> - 初稿ではないが、AIによる修正しか含まない場合は`<title>：修正内容 [ai-draft]`でコミットする
> - その後、人手で調整したものは`<title>：調整内容`でコミットする（`[ai-draft]` は付けない）
> - 後方互換のため、従来の`<title>：草稿を書かせた`も引き続きAI草稿として有効

### SVG図版の作成

- `/svg-diagram-component`スキルに図の内容を渡して作成する

### Mermaid図版の作成

- `Anki_`で始まるノードは暗記モード時にテキストが隠れるようになる

### 文体分析・執筆（author-style スキル）

著者の文体を分析してガイド化する `author-style-analyzer` と、そのガイドを使って著者らしい文章を書く `author-style-writer` の2スキルがある。仕組みと役割分担は [`author-style-skills.md`](./author-style-skills.md) を参照。

`author-style-analyzer` は、複数の役割（各分析担当・反証／境界レビュー担当・統合担当）が独立分析と反証レビューを行う構成で、**Workflow ツールによる決定論的オーケストレーション**で実行する。正典スクリプトは `.claude/skills/author-style-analyzer/references/analysis-workflow.js`。

#### 実行方式と有効化

以前は Agent Teams（teammates）で実行していたが、teammate 同士のピア通信がアイドル・デッドロックでハングしやすかったため、Workflow ベースへ移行した。**特別な有効化設定は不要**。スキル実行時にメインセッションがスコープを解決し、`references/analysis-workflow.js` を Workflow で実行する。

- **推奨 effort は Opus の `high`**（`xhigh` にする必要はない）。分析の質を左右する重い思考（独立分析・反証・境界・統合）は Workflow 内の各エージェントに `effort` が固定されており、**セッションの effort を継承しない**。そのためセッションを `xhigh` へ上げても成果物は良くならず、スコープ解決や報告などメインループ側の処理が重く・遅くなるだけ。`high` で実行するのが費用対効果の面で最適。
- 制御フローが JS のため**ハングしない**。各エージェントは構造化出力を返して終了し、待機プロセス（idle teammate）が残らない。
- **引数なしの全記事一括分析は行わない**。分析対象はスキル引数（`#id` またはカンマ区切り slug）で必ず絞る。全記事を対象にしたい場合はカテゴリ／セクション単位のチャンクに分割して順に実行する。
- Workflow を使えない環境では、サブエージェント（`Agent` ツール）を同じ3ステージ構成で順に呼ぶか、単一エージェントの役割切り替えで代替できる。

#### author-style-writer の推奨 effort（モード別）

`author-style-writer` は analyzer と違い Workflow を使わず、執筆の全工程（思考設計→構成→初稿→表現調整→推敲→自己レビュー）を**メインセッションのモデルが直接行う**。effort を固定したサブエージェントに逃がす部分がないため、**セッションの effort が執筆そのものの質を直接左右する**（analyzer で `high` を推奨したのは、重い思考が固定 effort のサブエージェント側にあり session effort を継承しないため。writer はこの前提が当てはまらない）。記法・書式の必須ルール＋文体4ガイド＋技術的正確さの優先という多制約の同時充足が要るタスクなので、xhigh の追加熟考は無駄にならない。

- **生成モード（新規本文、とくに技術的に密／長めの記事）: `xhigh` 推奨**。多制約の同時充足と技術的正確さで熟考が効く。質を優先する場面。
- **編集モード・軽い推敲・小さな加筆: `high` 推奨**。変更が周囲の既存文に強く制約され xhigh の上積みが小さい。人手レビューを挟む反復では速さ・コストの面でも `high` が快適。

> [!NOTE]
> effort は内部推論の深さを上げるだけで、出力を冗長・不自然にするものではない。文章の自然さは推敲ステップと `refine-style.md` が担保する。

## データ更新スクリプト

### 慣用色名データの更新

`app/src/lib/data/jis_colors.json`において、`rgb`・`approximatePccs`はコマンドにより自動生成されます。
`cmyk`・`munsell`の値を更新した場合は、次のコマンドを実行してください。

```bash
npm run data:jis-update
```

このコマンドの実行には、次が必要です。

- `app/scripts/icc/JapanColor2011Coated.icc`（Webからダウンロード）
- `app/scripts/icc/sRGB.icc`（macOSの場合はシステムにある`sRGB Profile.icc`をコピー）
- `ImageMagick`コマンド

## スキル一覧（引数パターン）

`.claude/skills/` 配下の全スキルと、受け付ける引数パターンの一覧。`<...>` は必須、`[...]` は省略可。

### 記事ページ作成

- **create-cg-page** — CG・画像処理の雛形ページを作成
  - `/create-cg-page <ページタイトル>`（日本語タイトル。`cg/*.yaml` 全体から一致する `CgDraftLink` を検索）
- **create-color-theory-page** — 色の理論の雛形ページを作成
  - `/create-color-theory-page <ページタイトル>`
- **create-color-fields-page** — 色の活用分野の雛形ページを作成
  - `/create-color-fields-page <ページタイトル>`

### 記事執筆・文体（author-style）

- **author-style-writer** — 著者らしい文体で本文を生成／編集／推敲・レビュー（引数はいずれも省略可。省略時は文脈から対象を特定）
  - `/author-style-writer <slug>` — 生成モード（草稿執筆）
  - `/author-style-writer <slug> <編集指示>` — 編集モード（既存本文に手直し）
  - `/author-style-writer <slug> <keywords(カンマ区切り)>` — 指定キーワードを必ず織り込んで生成
- **author-style-analyzer** — 過去記事とGit履歴を分析し文体ガイドを更新（引数任意。全記事一括分析は行わない）
  - `/author-style-analyzer #<id>` — YAMLの当該id配下の実装済み記事を分析（`#id` は1つだけ）
  - `/author-style-analyzer <slug1>,<slug2>,…` — カンマ区切り slug の記事を分析
  - `/author-style-analyzer` — 引数なし。範囲指定を促す（`#id`／slug の指定を求める）

### 図版・コンポーネント

- **svg-diagram-component** — SVG図解コンポーネントを作成（引数構成で3パターンを自動判定）
  - `/svg-diagram-component <図の内容>` — パターンA（カテゴリは内容から判断）
  - `/svg-diagram-component <配置先ディレクトリ> <図の内容>` — パターンB（`app/src/lib/demo/<dir>/` に作成）
  - `/svg-diagram-component [配置先ディレクトリ] <TODOから始まる文> [図の内容]` — パターンC（該当ページを検索し反映まで行う）
- **svelte-component-guideline** — Svelteコンポーネント実装時に参照するガイドライン（引数なし）
- **css-styling-guideline** — CSS記述時に参照するガイドライン（引数なし）

### 設計・仕様・保守

- **spec-sparring** — 新機能の仕様を対話で壁打ちし `spec/` へ書き出す
  - `/spec-sparring <機能名>`（必須。無ければ対象をユーザーに尋ねる）
- **design-doc-updater** — 実装を分析し `DESIGN.md` を更新（引数任意。スコープ指定。複数はカンマ／空白区切り）
  - `/design-doc-updater` — 引数なし。全観点を分析し `DESIGN.md` 全体を差分更新
  - `/design-doc-updater <コンポーネント名／ディレクトリ名／ブランチ名／観点>` — 指定範囲に限って分析・加筆修正
- **repository-structure** — リポジトリ構造定義書を更新するためのガイドライン（引数なし）

## ドキュメント構成

- `docs`直下：アプリ全体に関する基本方針ドキュメント
- `docs/domains`：アプリ固有の知識を定義するドキュメント
- `spec`：`spec-sparring`で固めた機能単位の仕様

## 機能開発

### 1. 仕様の壁打ち（spec-sparring）

新機能や仕様変更は、実装に着手する前に `/spec-sparring [機能名]` で仕様を対話的に固める。

- ユーザーへの質問で構想を引き出すことを主軸に、論点（目的・スコープ・ユーザーストーリー・機能要件・既存機能との整合・ドメインルール・データ／状態・エッジケース・非機能要件・制約・受け入れ条件）を体系的に網羅する。
- 各論点で前提を疑い、代替案・トレードオフ・リスクを提示して「壁」として打ち返す。
- 決定権はユーザーにあり、勝手に確定させない。曖昧な点・その場で決められない点は「未確定・保留事項」として明示する。
- 合意が取れたら仕様を `spec/[スラッグ].md` に書き出す。ここまでが本工程で、実装には飛ばない。

```
/spec-sparring トーン別配色のお気に入り保存
```

必要に応じて、関連するドメインルール（`docs/domains/`）や既存の仕様（`spec/`）を参照させる。用語や命名は既存コード・既存仕様に合わせる。

### 2. 実装

`spec/[スラッグ].md` に固めた仕様に沿って実装に着手するよう指示する。実装中に仕様の見直しが必要になった場合は、`spec/[スラッグ].md` を更新して合意を取り直す。

### 3. 調整や不具合対応

1. 動作確認を行い、変更・修正すべき箇所の対応を指示する。
2. 仕様レベルの判断を伴う調整は、`/spec-sparring` で論点を詰め直し、`spec/[スラッグ].md` に反映する。

### 4. 品質チェック

`app`ディレクトリ内で次のコマンドを実行し、エラーや警告が出た場合は修正を行う：

- `npm run check` - 型に関するチェック
- `npm run lint` - 文法や書式に関するチェック

また、PRをマージする前など、開発がひと段落ついたタイミングで、次のコマンドを実行する：

- `npx knip` - 未使用変数などの検出
- `/repository-structure`（claude）- ディレクトリ構成の更新
