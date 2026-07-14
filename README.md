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
> - AIに書かせた初稿は`<title>：草稿を書かせた`でコミットする
> - その後、人手で調整したものは`<title>：調整内容`でコミットする

### SVG図版の作成

- `/svg-diagram-component`スキルに図の内容を渡して作成する

### Mermaid図版の作成

- `Anki_`で始まるノードは暗記モード時にテキストが隠れるようになる

### 文体分析・執筆（author-style スキル）

著者の文体を分析してガイド化する `author-style-analyzer` と、そのガイドを使って著者らしい文章を書く `author-style-writer` の2スキルがある。仕組みと役割分担は [`author-style-skills.md`](./author-style-skills.md) を参照。

`author-style-analyzer` は、複数の役割（各分析担当・反証／境界レビュー担当・統合担当）が独立分析と反証レビューを行う構成で、**Workflow ツールによる決定論的オーケストレーション**で実行する。正典スクリプトは `.claude/skills/author-style-analyzer/references/analysis-workflow.js`。

#### 実行方式と有効化

以前は Agent Teams（teammates）で実行していたが、teammate 同士のピア通信がアイドル・デッドロックでハングしやすかったため、Workflow ベースへ移行した。**特別な有効化設定は不要**。スキル実行時にメインセッションがスコープを解決し、`references/analysis-workflow.js` を Workflow で実行する。

- 制御フローが JS のため**ハングしない**。各エージェントは構造化出力を返して終了し、待機プロセス（idle teammate）が残らない。
- **引数なしの全記事一括分析は行わない**。分析対象はスキル引数（`#id` またはカンマ区切り slug）で必ず絞る。全記事を対象にしたい場合はカテゴリ／セクション単位のチャンクに分割して順に実行する。
- Workflow を使えない環境では、サブエージェント（`Agent` ツール）を同じ3ステージ構成で順に呼ぶか、単一エージェントの役割切り替えで代替できる。

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
- `docs/ideas`：機能単位で検討した初期仕様
- `docs/.reviews`：初期仕様の要改善点レポート
- `.steering`：作業ごとの実装や意思決定レポート

※ ここに記載したドット（`.`）始まりのディレクトリ内はClaude Codeが生成するファイル群で、人間が手を加えることはない。

## 機能開発

### 1. ブレインストリーミング

1. 新機能や既存機能の仕様変更の構想（アイデアドキュメント）を`/docs/ideas`配下に作成する（人間）
2. `/refine-idea docs/ideas/hogehoge.md`スラッシュコマンドで`docs/.reviews`配下にレビューレポートを作成する（Claude Code）
3. レビューレポートに基づいて、アイデアドキュメントをブラッシュアップして更新する（Claude Code）
4. 更新されたアイデアドキュメントを確認し、認識や知識のズレを修正する（人間 + Claude Code）
5. `/refine-idea`スラッシュコマンドで再レビューを行う（Claude Code）
6. 作成されたレビューレポートのうち、現時点で解消しておくべき修正点が無くなるまで、3~4を繰り返す
     - レビューレポートの指摘箇所をすべて潰す必要はない
     - 指摘箇所を現時点で解消すべきかどうかは、人間が判断する
7. アイデアドキュメントを基に、`docs`直下の各種ドキュメントを更新する（Claude Code）

#### 補足：1-3. レビューレポートに基づくブラッシュアップ

単純な加筆要請はClaude Codeに作業させつつ、対話的に指摘箇所を解消していく：

```
@docs/.reviews/hogehoge.md の指摘内容に基づいて、 @docs/ideas/hogehoge.md の加筆修正を行ってください。不明点や複数の選択肢がある場合は質問してください。
```

#### 補足：1-7. `docs`直下のドキュメントの更新

プロンプトは次のようなシンプルなものでOK：

```
@docs/ideas/hogehoge.md の内容を @docs 直下の各種ドキュメントに反映してください。
```

ドキュメントが更新されたら、次の点を重点的に確認する：

- `docs/product-requirements.md`の「機能要件」
  - 機能を細分化して連番を振ることで、段階的な実装を依頼しやすい
  - 実装を依頼しやすい順序や粒度になっているかを確認する
- `docs/domains/glossary.md`
  - 命名規則や用語に齟齬がないかが重要となる

### 2. 実装

- 機能の追加や変更は、ステアリングドキュメントを作成してから作業に入る
  - `/create-steering [開発タイトル]` スラッシュコマンドで、`requirements.md` → `design.md` → `tasklist.md` をサブエージェントに委譲して段階的に作成する（各ステップで人間の承認を挟む）
- 詳細な仕様として、先ほどブラッシュアップしたアイデアドキュメントを参照させる

```
/create-steering F3の5~6の実装
詳細な仕様は @docs/ideas/hogehoge.md 、対応する機能要件は @docs/product-requirements.md のF3の5~6を参照してください。
```

ステアリングドキュメントが揃ったら、`tasklist.md` に沿って実装に着手するよう指示する。

### 3. 調整や不具合対応

1. 動作確認を行い、変更・修正すべき箇所の対応を指示する
2. 変更・修正対応が終わったら、`/create-steering` で新規ステアリングドキュメントを作成し、変更の意図・内容・設計判断などを記録させる

```
/create-steering 今回の調整内容の記録
```

### 4. 品質チェック

`app`ディレクトリ内で次のコマンドを実行し、エラーや警告が出た場合は修正を行う：

- `npm run check` - 型に関するチェック
- `npm run lint` - 文法や書式に関するチェック

また、PRをマージする前など、開発がひと段落ついたタイミングで、次のコマンドを実行する：

- `npx knip` - 未使用変数などの検出
- `/repository-structure`（claude）- ディレクトリ構成の更新
