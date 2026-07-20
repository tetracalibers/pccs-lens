---
name: generate-ogp-image
description: 引数で受け取ったページスラッグ（glob 可）の OGP 画像を手動生成するスキル。ogimage/ の正典設定でバリエーションを判定し、対象ページのコードからタイトル・パンくずを解決し、長いタイトルの改行案を提示・確認し、nested-fig 対象では図版の要否を確認したうえで、確定値を JSON で描画スクリプト（ogimage/render.mjs）に渡して PNG を app/static/ogp/ に生成し、マニフェストを更新する。OGP画像を作りたい・生成したい場合に使用する。
---

# OGP 画像生成スキル

各ページの OGP / Twitter Card 用画像（1200×630 PNG）を**手動・オンデマンド**で生成するスキル。

このスキルは**知能層**を担う。ページのコードを読んでバリエーション・タイトル・パンくずを解決し、
改行位置や図版の要否を判断して、**確定値**を描画スクリプト `ogimage/render.mjs` に手渡す。
描画スクリプトは受け取った確定値をテンプレートに流し込み PNG 化するだけで、ページ探索やメタ抽出は行わない。

## 前提（初回のみ）

`ogimage/` は app とは独立した Node パッケージ。初回は依存とフォントを用意する（リポジトリのルートから）:

```sh
cd ogimage && npm install && npm run fonts && cd ..
```

- `npm install` … `@resvg/resvg-js`（PNG 化）・`picomatch`（glob 判定）・`wawoff2`（フォント変換）
- `npm run fonts` … Google Fonts / OFL から Zen Kaku Gothic New 400/500/700・SUSE Mono 800・Reddit Mono 500 を `ogimage/fonts/` に取得

`ogimage/fonts/` が空だと日本語などが描画されないので、必ず先に取得しておくこと。

## 入力

- **ページスラッグ**（必須）: 1 つ以上。ワイルドカード/glob 可（例: `/color-theory/pccs-basics`, `/color-theory/*`, `/games/*`）。
  - スラッグはルート（route）を指す。先頭スラッシュの有無は問わない。

## 手順

### 1. 対象ルートを確定する

- glob を含む場合は `app/src/routes/` 配下の実在ルートに展開する。
  - svx ページ: `app/src/routes/<base>/<slug>/+page.svx`
  - CG 記事: `app/src/routes/cg/<unit>/<article>/+page.svx`
  - 動的ルート（`/jis-color-map/<family>`, `/patterns/<theme>`, `/cg/<unit>`）は、対応するデータ定義から実在キーを展開する（下の「解決リファレンス」参照）。
- **draft ページ（svx フロントマターに `draft: true`）は対象から除外する**（noindex。個別生成せず既定画像にフォールバックさせる）。

### 2. バリエーションを判定する（正典設定）

- **`ogimage/config.mjs` が唯一の情報源**。ルート → バリエーション種別・図版の可否をここで定義している。
- 各対象ルートについて、`config.mjs` の `OG_RULES`（上から最初にマッチした規則を採用）で
  `variation`（`default` / `title-only` / `nested` / `nested-fig`）と `figure`（`none` / `optional` / `required`）を得る。
- 規則に該当しないルートは**明確なエラーで停止**し、勝手に生成しない。

### 3. タイトル・パンくずを解決する

「解決リファレンス」に従って、対象ページのコード／データからタイトルと crumbs を算出する。

- `title` … サイト名サフィックス（`— Color Prism` / `- Color Prism`）は必ず除去する。これが og:title になる。
- `crumbs` … **トップ区分＋中間カテゴリ**の祖先連鎖（タイトルの手前まで、可変 1〜N 個）。
  オンページのパンくず（カテゴリのみ）と違い、OGP では**トップ区分も含める**。

### 4. タイトルの改行案を提示する（最大 2 行）

- タイトルが 1 行で収まらなそうな長さなら、意味の切れ目で分けた**最大 2 行**の改行案を提示し、ユーザーの確認・修正を得る。
  - nested-fig は図版が右にあるためタイトル幅が狭い（改行されやすい）。
- 幅超過時は描画スクリプトが font-size を自動縮小して収める（3 行以上は不可）。
- **glob で複数ページを処理するときは、改行案を一括提示してまとめて承認**してもらう（個別修正可）。

### 5. 図版の要否を確認する（nested-fig 対象のみ）

- `figure: "optional"`（`/color-theory/*`, `/color-fields/*`）: **図版を入れるか都度ユーザーに確認**する。
  - 入れる場合は `nested-fig`、入れない場合は `nested` として扱う。
  - **svx ページなら、`<script>` 内で import している図版候補（`$lib/demo/**` のコンポーネント）を一覧提示**し、どれを入れたいか尋ねる。
    Svelte デモの自動 SVG 化は行わない方針のため、**ユーザーが用意した図版 PNG のパスを受け取る**（自己完結した手渡し画像）。
- `figure: "required"`（`/jis-color-map/<family>`, `/patterns/<theme>`）: 定型プレビュー。当面は**ユーザーが用意した手渡し PNG のパスを受け取る**。
- 一括処理中でも、図版の要否は**ページごとに確認**する（改行案の一括承認とは別）。

### 6. 描画スクリプトを実行する

確定値を JSON にして `ogimage/render.mjs` に渡す（リポジトリのルートから実行）。

単一ページ:

```sh
node ogimage/render.mjs --json '{
  "variation": "nested",
  "route": "color-theory/pccs-basics",
  "title": "PCCSと色の分類",
  "titleLines": ["PCCSと色の分類"],
  "crumbs": ["色の理論", "PCCSと色彩調和"]
}'
```

図版入り（nested-fig。`figure` はユーザーから受け取った PNG パス）:

```sh
node ogimage/render.mjs --json '{
  "variation": "nested-fig",
  "route": "color-theory/pccs-basics",
  "title": "PCCSと色の分類",
  "titleLines": ["PCCSと", "色の分類"],
  "crumbs": ["色の理論", "PCCSと色彩調和"],
  "figure": "tmp/pccs-tone.png"
}'
```

一括（配列。長い JSON は一時ファイルにして `--input` で渡すと安全）:

```sh
node ogimage/render.mjs --input tmp/ogp-batch.json
```

JSON フィールド:

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `variation` | ○ | `default` / `title-only` / `nested` / `nested-fig` |
| `route` | ○（default 以外） | マニフェスト用キー & 出力パス算出（先頭/末尾スラッシュ無し。例: `color-theory/pccs-basics`） |
| `title` | ○（default 以外） | og:title 用の完全なタイトル（改行なし・サフィックス無し） |
| `titleLines` | ○（default 以外） | 描画用の改行済みタイトル（1〜2 要素の配列） |
| `crumbs` | ○（nested / nested-fig） | パンくずラベルの配列（可変個） |
| `figure` | ○（nested-fig） | 図版 PNG のパス（実行時 cwd 基準）。png/jpg/svg/webp 可 |
| `out` | 省略可 | 出力先。省略時は `app/static/ogp/<route>.png` |

- default 画像（サイト全体の既定 og:image）は既に `app/static/ogp/default.png` にある。再生成する場合のみ:
  `node ogimage/render.mjs --json '{"variation":"default","out":"app/static/ogp/default.png"}'`
- **出力は同一パスへ上書き（冪等）**。

### 7. 結果を確認・報告する

- 生成された PNG のパスを報告する。**見た目（日本語・英字ロゴ・crumb・図版の描画）はユーザーが目視確認する**（自動視覚検証・ヘッドレスブラウザは使わない）。
- 描画スクリプトが `app/src/lib/meta/og-manifest.json` を自動更新している（`route` 付き・default 以外のとき）。
  アプリの `<SiteMeta>` はこのマニフェストを参照して固有 og:image / og:title を出し、未登録は既定画像にフォールバックする。

## 解決リファレンス（タイトル・パンくずの取得元）

「トップ区分」= そのコンテンツが属する一覧ページ名。「中間カテゴリ」= その下のカテゴリ／ユニット。

| ルート | variation | title の取得元 | crumbs（トップ区分＋中間カテゴリ） |
| --- | --- | --- | --- |
| `/` | default | （不要。メイン=サイト名） | — |
| `/concept` | title-only | 「このサイトの歩き方」（`app/src/lib/layouts/concept.svelte`） | — |
| `/color-theory`, `/color-fields`, `/jis-color-map`, `/cg` | title-only | `app/src/lib/meta/site-nav.ts` の該当 NAV アイテム label（色の理論 / 色の活用分野 / 慣用色名マップ / CGと画像処理） | — |
| `/patterns` | title-only | 「配色シミュレータ」（`app/src/routes/patterns/+page.svelte` の `<title>`） | — |
| `/jis-color-map/all` | title-only | 「すべての慣用色名一覧」（`+page.svelte` の `<title>`） | — |
| `/games/<slug>` | title-only | `app/src/routes/games/<slug>/+page.svelte` の `<title>` からサフィックス除去 | — |
| `/approximate`, `/analyze` | title-only | 各 `+page.svelte` の `<title>` からサフィックス除去 | — |
| `/color-theory/<slug>` | nested / nested-fig | `+page.svx` フロントマターの `title` | `["色の理論", <category>]`。category は `app/src/lib/content-pages/color-theory.yaml` の該当カテゴリ `title`（`colorTheoryCategoryBySlug` と同じ対応）。該当なしなら `["色の理論"]` |
| `/color-fields/<slug>` | nested / nested-fig | `+page.svx` フロントマターの `title` | `["色の活用分野", <category>]`（`color-fields.yaml` / `colorFieldsCategoryBySlug`）。該当なしなら `["色の活用分野"]` |
| `/cg/<unit>` | nested | `app/src/lib/content-pages/cg/<unit>.yaml` の先頭 `title` | `["CGと画像処理"]` |
| `/cg/<unit>/<article>` | nested | `+page.svx` フロントマターの `title` | `["CGと画像処理", <unit title>]`（unit title は `cg/<unit>.yaml` の先頭 `title`） |
| `/jis-color-map/<family>` | nested-fig | `app/src/lib/data/jis-colors` の `JIS_COLOR_FAMILIES` から id 一致の `name`（例:「<name>の慣用色名マップ」） | `["慣用色名マップ"]` |
| `/patterns/<theme>` | nested-fig | patterns のテーマ定義（`/patterns/[theme]/+page.ts` が読む labelJa） | `["配色シミュレータ"]` |

- サフィックス除去: `<title>` から末尾の `— Color Prism` / `- Color Prism` を取り除く。
- crumbs のトップ区分は一覧ページ名（`色の理論` など）で、オンページのパンくず（カテゴリのみ）に**トップ区分を足したもの**。

## エラー・エッジケース

- スラッグ該当なし／`config.mjs` に規則が無い: 明確なエラーで停止する。
- nested-fig 指定で図版パスが無効・不在（単一ページ時）: 描画スクリプトがエラーで停止する。
- draft ページ: 個別生成しない（既定画像にフォールバック）。
- 既存画像の再生成: 同一パスへ上書き（冪等）。
- タイトルが最大 2 行でも幅超過: 描画スクリプトが font-size を自動縮小して収める。3 行以上の `titleLines` はエラー。
