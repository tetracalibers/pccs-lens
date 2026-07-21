---
name: generate-ogp-image
description: 引数で受け取ったページスラッグ（glob 可）の OGP 画像を手動生成するスキル。ogimage/ の正典設定でバリエーションを判定し、対象ページのコードからタイトル・パンくずを解決し、長いタイトルの改行案を提示・確認し、図版は第2引数のパスで受け取り（nested-fig 対象で未指定のときのみ要否を対話確認）、確定値を JSON で描画スクリプト（ogimage/render.mjs）に渡して PNG を app/static/ogp/ に生成し、マニフェストを更新する。OGP画像を作りたい・生成したい場合に使用する。
effort: high
---

# OGP 画像生成スキル

各ページの OGP / Twitter Card 用画像（1200×630 PNG）を**手動・オンデマンド**で生成するスキル。

このスキルは**知能層**を担う。ページのコードを読んでバリエーション・タイトル・パンくずを解決し、
改行位置や図版の要否を判断して、**確定値**を描画スクリプト `ogimage/render.mjs` に手渡す。
描画スクリプトは受け取った確定値をテンプレートに流し込み PNG 化し、加えて確定値を**記録**（`ogimage/data/<route>.json`）に永続化し、図版を `ogimage/data/assets/<route>/` に永続コピーする。ページ探索やメタ抽出は行わない。

> **記録と一括再生成**：スキルが解決した確定値は記録として残るので、テンプレートのリデザイン後は `node ogimage/regenerate.mjs`（対話ゼロの一括再生成）で記録のある全ページを作り直せる。このスキルは**個別ページの初回生成・コンテンツ変更後の個別再生成**を担う（一括再生成そのものはスキル不要）。

## 前提（初回のみ）

`ogimage/` は app とは独立した Node パッケージ。初回は依存とフォントを用意する（リポジトリのルートから）:

```sh
cd ogimage && npm install && npm run fonts && cd ..
```

- `npm install` … `@resvg/resvg-js`（PNG 化）・`picomatch`（glob 判定）・`wawoff2`（フォント変換）
- `npm run fonts` … Google Fonts / OFL から Zen Kaku Gothic New 400/500/700・SUSE Mono 800・Reddit Mono 500 を `ogimage/fonts/` に取得

`ogimage/fonts/` が空だと日本語などが描画されないので、必ず先に取得しておくこと。

## 入力

- **ページスラッグ**（第1引数・必須）: 1 つ以上。ワイルドカード/glob 可（例: `/color-theory/pccs-basics`, `/color-theory/*`, `/games/*`）。
  - スラッグはルート（route）を指す。先頭スラッシュの有無は問わない。
- **図版の画像パス**（第2引数・省略可）: nested-fig の図版として埋め込む画像（png/jpg/svg/webp）のパス（実行時 cwd 基準）。
  - **指定されていれば最初からこれを図版に使う**（図版の要否は対話で確認しない）。対象は nested-fig として扱う（手順 5 の優先順 1）。
  - 意味を持つのは図版を持てるルート（`config.mjs` の `figure` が `optional` / `required`）のみ。図版を持てないルート（`figure: "none"`）に第2引数が渡されたら、その旨を伝えて無視する。
  - 単一ページを対象にするときに使う。glob で複数ルートを対象にする場合は 1 つの画像パスを全ルートに割り当てられないため、第2引数は用いず各ルートで個別に確認する（手順 5）。

## 手順

### 0. 既存記録があれば再利用する（再実行時）

- 対象ルートに **既存の記録 `ogimage/data/<route>.json` があれば、それを既定値として読み込む**（自分が過去に書いた記録を読むだけ。アプリのコード走査ではないので責務分離は崩れない）。
  - **図版**：記録に `figure` があり、その永続アセット（`ogimage/data/assets/<route>/figure.<ext>`）が実在すれば、**それを既定で流用**する（手渡しをやり直さない）。差し替えたいときだけ新規の図版 PNG パスを受け取る。アセットが欠損していたら新規手渡しを促す。
  - **改行**：記録の `titleLines` を、改行案の**初期提案**として提示する（ユーザーは修正可）。
- title・カテゴリを変更したページの個別再生成もこの流れ（記録は render.mjs が上書き更新する）。**コンテンツ変更に追従した記録の自動更新は行わない**ので、変わったページはこのスキルで個別に生成し直す。

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
  - **既存記録があれば、保存済み `titleLines` を初期提案として提示する**（手順 0）。
  - nested-fig は図版が右にあるためタイトル幅が狭い（改行されやすい）。
- 幅超過時は描画スクリプトが font-size を自動縮小して収める（3 行以上は不可）。
- **glob で複数ページを処理するときは、改行案を一括提示してまとめて承認**してもらう（個別修正可）。

### 5. 図版を決める（nested-fig 対象のみ）

図版の決定は次の優先順で行う（上に該当したら下は見ない）:

1. **第2引数で図版パスを受け取っていれば、それをそのまま図版に使う**（対話での要否確認はしない）。対象は nested-fig として扱い、そのパスを `figure` に指定する。白背景 PNG のときは knockoutWhite を確認する（下記）。
2. **既存記録に図版があれば流用する**（手順 0）。保存済みアセット `ogimage/data/assets/<route>/figure.<ext>` が実在すれば、その永続パスを `figure` に指定して再利用する。
3. **どちらも無ければ、以下に従って対話で要否・図版を確認する。**

- `figure: "optional"`（`/color-theory/*`, `/color-fields/*`）: **図版を入れるか都度ユーザーに確認**する。
  - 入れる場合は `nested-fig`、入れない場合は `nested` として扱う。
  - **svx ページなら、`<script>` 内で import している図版候補（`$lib/demo/**` のコンポーネント）を一覧提示**し、どれを入れたいか尋ねる。
    Svelte デモの自動 SVG 化は行わない方針のため、**ユーザーが用意した図版 PNG のパスを受け取る**（自己完結した手渡し画像）。
- `figure: "required"`（`/jis-color-map/<family>`, `/patterns/<theme>`）: 定型プレビュー。当面は**ユーザーが用意した手渡し PNG のパスを受け取る**。
- 一括処理中でも、図版の要否は**ページごとに確認**する（改行案の一括承認とは別）。

#### 白背景の透過（knockoutWhite）の要否も確認する

図版を入れると決めたら、**その図版が白背景の PNG かどうかを見て、背景の白を透過するか確認する**。

- 白背景の PNG をそのまま埋め込むと、装飾背景（白ベース＋淡いにじみ）の上に白い「箱」として浮く。透過すると装飾背景に馴染む。
- **白背景の PNG のときだけ確認**し、yes なら payload に `knockoutWhite: true` を載せる。黒背景・その他色背景・透過済み・PNG 以外の図版には**付けない**（PNG 以外に付けると描画スクリプトがエラーで停止する）。
- 内部で囲まれた白（白抜き文字・白い塗り）は残る（背景に繋がった白だけ消える）。
- 縁の抜け具合を調整したいときだけ `magickFuzz`（既定 `"5%"`）を一緒に載せる。値は数値＋任意の `%`（例 `"5%"`, `"10"`, `"12.5%"`）。
- **生成時に ImageMagick 7（`magick`）が必要**。未導入で `knockoutWhite: true` を使うと描画スクリプトが明確なエラーで停止するので、その旨をユーザーに伝えて導入を促す（`brew install imagemagick` など）。
- 透過は生成時のローカル処理で、**記録には透過フラグを持たせない**。透過済み PNG が `data/assets/<route>/figure.png` に保存され、一括再生成はそれをそのまま使う（regenerate は ImageMagick 非依存）。
- 既存記録の図版を流用する場合（手順 0）は**すでに透過済みなので `knockoutWhite` は付けない**（再度付けても概ね無害だが不要）。差し替えで新しい白背景 PNG を受け取ったときだけ改めて確認する。

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

白背景の図版を透過して埋め込む場合（`knockoutWhite`。要 ImageMagick。`magickFuzz` は任意）:

```sh
node ogimage/render.mjs --json '{
  "variation": "nested-fig",
  "route": "color-theory/pccs-basics",
  "title": "PCCSと色の分類",
  "titleLines": ["PCCSと", "色の分類"],
  "crumbs": ["色の理論", "PCCSと色彩調和"],
  "figure": "tmp/pccs-tone.png",
  "knockoutWhite": true,
  "magickFuzz": "5%"
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
| `figure` | ○（nested-fig） | 図版 PNG のパス（実行時 cwd 基準）。png/jpg/svg/webp 可。`data/assets/<route>/figure.<ext>` へコピーされ永続化される。再利用時はこの永続パスを渡せばよい（同一パスなのでコピーはスキップ） |
| `knockoutWhite` | 省略可 | `true` で nested-fig の **PNG** 図版の背景白を透過してから埋め込む（要 ImageMagick）。白背景の PNG のときだけ付ける。省略時 `false` |
| `magickFuzz` | 省略可 | `knockoutWhite` 時の `-fuzz` 値（数値＋任意の `%`。例 `"5%"`）。縁の抜け具合を調整。省略時 `"5%"` |
| `out` | 省略可 | 出力先。省略時は `app/static/ogp/<route>.png` |

- default 画像（サイト全体の既定 og:image）は既に `app/static/ogp/default.png` にある。再生成する場合のみ:
  `node ogimage/render.mjs --json '{"variation":"default","out":"app/static/ogp/default.png"}'`
- **出力は同一パスへ上書き（冪等）**。

### 7. 結果を確認・報告する

- 生成された PNG のパスを報告する。**見た目（日本語・英字ロゴ・crumb・図版の描画）はユーザーが目視確認する**（自動視覚検証・ヘッドレスブラウザは使わない）。
- 描画スクリプトが以下を自動で行っている（`route` 付き・default 以外のとき）:
  - **記録**：`ogimage/data/<route>.json` に確定値（title / titleLines / crumbs / figure）を書き出す（title-only も書く）。図版は `ogimage/data/assets/<route>/figure.<ext>` に永続コピーされ、記録の `figure` は永続パスに書き換わる。
  - **マニフェスト**：`app/src/lib/meta/og-manifest.json` を upsert する。アプリの `<SiteMeta>` はこれを参照して固有 og:image / og:title を出し、未登録は既定画像にフォールバックする。
- **タスクリストを更新する**（スキル層の責務。描画スクリプトはこれを行わない）：生成に成功したルートについて、`ogimage/OGP-TASKLIST.md` の該当行 `- [ ] \`/<route>\`` を `- [x]` に更新する。
  - glob で複数生成したときは、成功した全該当行を更新する。
  - 既に `[x]` の場合はそのままにする。
  - **該当行がリストに無い場合は追加する**：バリエーション／エリアに対応するセクション（例: `/cg/<unit>` なら「CGと画像処理 — ユニット一覧ページ」）の末尾に `- [x] \`/<route>\`` を挿入する。適切なセクションが無ければ、最も近いセクションに追加する。
  - default（`/`）や draft はもともとリスト対象外なので更新・追加しない。
- 記録・図版アセット・出力 PNG・**更新した `OGP-TASKLIST.md`** は**コミット対象**。生成後にコミットに含める。

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
- `knockoutWhite: true` で ImageMagick 未導入 / PNG 以外の図版 / 不正な `magickFuzz`: 描画スクリプトがエラーで停止する。ImageMagick 未導入ならユーザーに導入を促す。
- draft ページ: 個別生成しない（既定画像にフォールバック）。
- 既存画像の再生成: 同一パスへ上書き（冪等）。記録・図版アセットも同一パスへ上書き。
- 記録の再利用時に保存済み図版アセットが欠損: 流用せず、新規手渡しを促す。
- タイトルが最大 2 行でも幅超過: 描画スクリプトが font-size を自動縮小して収める。3 行以上の `titleLines` はエラー。
