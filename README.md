# Color Prism

## コンテンツ開発

### 記事ページの作成・執筆

記事は「CG・画像処理」「色の理論」「色の活用分野」の3種類があり、いずれも次の流れで作成する。

1. **雛形の作成**：一覧の下書きリンクから雛形ページ（`+page.svx`）を起こす。記事の種類に応じたスキルにページタイトルを渡す。
   - CG・画像処理：`/create-cg-page`
   - 色の理論：`/create-color-theory-page`
   - 色の活用分野：`/create-color-fields-page`
2. **リンク先の準備**（必要なら）：`/prepare-link-targets <キーワード一覧>` で、その記事から本文リンクを張りたい語のリンク先を洗い出す。既存ページで足りる語と、下書きリンクのままでルートが無い語（＝リンクできない語）を分類し、後者の雛形を起こす。
3. **草稿の執筆**：`/author-style-writer <slug>` で、本文の草稿を著者らしい文体で執筆する（スキルの引数の詳細は後述）。
4. **編集・手直し**：`/author-style-writer <slug> <編集指示>` で、すでに本文のあるページに編集を加える（スキルの引数の詳細は後述）。
5. **書き溜めた編集指示の一括対応**：本文に `:::Add`（加筆したい箇所）・`:::Delete`（消す予定の記述）・`:::Fix`（既存の図版・デモ・文章への修正指示）を書き残しておき、`/apply-edit-requests <slug>` でまとめて片付ける。検出した全ブロックを表で提示して方針の承認を取り、`target` ごとに担当スキルの規約で対応し、済んだブロックを本文から取り除く（図版・デモの**新規**プレースホルダ `:::Todo` は対象外）。
6. **記法の整備**（既存記事）：`/format-math-notation <slug>` で、数式・インラインコードの表記を `writing-guides/math-notation-guide.md` に沿って整える。記法パスのベースライン（`app/.textlintignore`）に載っている記事はこれで違反を解消し、その行を外す。記法だけを直し、文章には手を入れない。

> [!IMPORTANT]
> 執筆した記事は、次のコミットメッセージ規約に従ってコミットする。`author-style-analyzer` が Git 履歴から「AI草稿 → 人手編集」の差分（`refine-style.md`）を追跡するのに使うため、この規約を守る。
>
> - AIに書かせた初稿は`<title> [ai-draft]`でコミットする
> - 初稿ではないが、AIによる修正しか含まない場合は`<title>：修正内容 [ai-draft]`でコミットする
> - その後、人手で調整したものは`<title>：調整内容`でコミットする（`[ai-draft]` は付けない）
> - 後方互換のため、従来の`<title>：草稿を書かせた`も引き続きAI草稿として有効

### 記事の公開（draft を外したとき）

frontmatter から `draft: true`（と直前の空行）を削除して記事を公開状態にしたら、**`/publish-article <slug>` で公開時タスクを回す**。手順の正典はこのスキルで、次の 0〜2 を実行し、3・4 は案内するだけにとどめる。

0. **編集指示ディレクティブの残存チェック（ゲート）**：本文に `:::Todo` / `:::Add` / `:::Delete` / `:::Fix` と、`{fixme}` 付きの `:::Action`（AIが書いたまま人手が入っていないデモ誘導文）が残っていないかを確認する。**1件でも残っていれば公開時タスクへ進まず**、対応に使うスキル呼び出しを**そのままコピペして実行できる形**で案内して止まる（`:::Todo` は `/svg-diagram-component` か `/add-threejs-demo`、`:::Add` / `:::Delete` / `:::Fix` はまとめて `/apply-edit-requests <slug>` の1行）。読者に見える形で公開されるのを防ぐためのゲートで、ブロックを外すか対応するかの判断は著者が行う（`:::Action{fixme}` は文面を直して `{fixme}` を外す。→ `writing-guides/syntax-guide.md` ルール4）。
1. **`visual` フラグの追加**：`$lib/demo/` の図解コンポーネントを使っているページは、frontmatter の `grades:` の次の行に `visual: true` を足す。一覧のリンクに「図解」タグが付く。Mermaid 図だけのページには付けない運用。
2. **OGP画像の生成**：`/generate-ogp-image <スラッグ>` で生成する。draft ページは glob・自然言語指定の展開から除外されるため、**公開してから**生成する。生成物（`app/static/ogp/**`・`ogimage/data/**`）・マニフェスト（`app/src/lib/meta/og-manifest.json`）・`ogimage/OGP-TASKLIST.md` はコミットに含める（コミットメッセージ規約は `CLAUDE.md` の「Git規約」を参照）。
3. **文体スタイルガイドの更新**：`/author-style-analyzer <slug>` を実行し、その記事が既存ルールのどれを支持するか（「AI草稿 → 人手編集」の差分を含む）を記録する。人手修正のコミットを済ませてから実行する（Git履歴が根拠になるため）。複数記事を公開したときはカンマ区切りでまとめて1回実行できる（`/author-style-analyzer <slug1>,<slug2>`）。推奨 effort は `high`（後述「文体分析・執筆（author-style スキル）」節）。どの記事を分析済みかは `writing-guides/STYLE-ANALYSIS-TASKLIST.md` に記録され、スキルが実行のたびに更新する（更新後のリストはコミットに含める）。
   - 既定は**根拠モード**で、書き込むのは根拠インデックス `writing-guides/evidence/` だけ。**ガイド本体は変わらない**（確度の降格を除く）。公開直後はこれで足りる。
   - 記事から見つかった新しい特徴は保留プール `writing-guides/pending/` へ1行で積まれ、採用するかどうかの判断は後述の**発見モード**へまとめる。完了報告に昇格候補と未処理の保留の件数が出るので、溜まってきたら発見モードを実行する。
4. **PR説明文の更新**：ここまでを push したうえで `/update-pr-description` を実行する。公開した記事がカテゴリ別に列挙され、**記事ごとに 1〜3 の実施状況がチェックリストとして載る**（判定できた分は自動でチェック済みになる）。未チェックの項目が残っていれば、それが公開後にやり残した作業。

> [!TIP]
> 公開のコミットを `/commit-this` で作る場合、差分から `draft: true` の削除を検出して **`/publish-article` を自動で呼ぶ**ので、上のスキルを手で叩く必要はない。コミットを挟んでフェーズを分けて呼ばれる（`--before-commit` で 0〜1 ＋ `writing-guides/STYLE-ANALYSIS-TASKLIST.md` の `[draft]` 解除を記事コミットに含め、コミット後に `--ogp` で 2 を生成して別コミット）。3・4 は自動実行しないので、コミット後に手動で行う。
>
> **0 のゲートで止まった場合は、公開時タスク（1・2 とタスクリストの書き換え）は実行されず、コミットだけが進む。** 案内されたスキルでディレクティブに対応したあと、`/publish-article <slug>` を実行して、その変更を別コミットにする。

### コンテンツ一覧（YAML）を編集したとき

`app/src/lib/content-pages/**/*.yaml`（`color-theory.yaml`・`color-fields.yaml`・`cg/*.yaml`）は、記事の掲載順と掲載先を決める一覧データ。**この並びは2つのタスクリストにそのまま写されている**ため、並べ替え・改名・`DraftLink` → `PageLink` の置き換えをしたら追随させる。

```sh
npm --prefix scripts install              # 初回のみ（YAML パーサを入れる）
node scripts/sync-tasklists.mjs --check   # 差分を報告するだけ（差分があれば exit 1）
node scripts/sync-tasklists.mjs --write   # 差分を書き込む
```

- 対象は `ogimage/OGP-TASKLIST.md` と `writing-guides/STYLE-ANALYSIS-TASKLIST.md`。見出しに `` （`<yaml>` #<id>）`` の参照を持つセクションだけを YAML 順に組み直す。トップ・ゲーム・慣用色名マップなど手書きのセクションには触れない。
- **`[x]`（生成済み・分析済み）は作りも消しもしない。** 直すのは並び順・行の過不足・`[ページ未作成]` ↔ ``[draft] `/route` `` の変換まで。`draft: true` なのに `[x]` のような矛盾は警告として出るだけ。
- YAML に想定外の記述があるとエラーで停止し、**1行も書き込まない**。
- `/create-color-theory-page`・`/create-color-fields-page`・`/create-cg-page` は雛形作成の最後にこれを実行する。`/prepare-link-targets` も、複数の雛形を起こし終えた最後に1回実行する。`/commit-this` も、コミット対象に YAML や `+page.svx` の frontmatter 変更が含まれていれば `--check` して差分を提示する。

### SVG図版の作成

- `/svg-diagram-component`スキルに図の内容を渡して作成する
- 本文に `:::Todo` プレースホルダを置いてある箇所の図なら、**ディレクティブの中身（図の名前）だけ**を渡す（`:::Todo` の行や `TODO：` 接頭辞は付けない）。該当ページを検索して、コンポーネントの作成からページへの差し込み（import・`visual: true`・プレースホルダの置き換え）まで行う
- 配置先ディレクトリを指定したいときは、`[munsell] マンセル色立体の水平断面図` のように**角括弧で囲んで先頭に置く**

### Mermaid図版の作成

- `Anki_`で始まるノードは暗記モード時にテキストが隠れるようになる

### 文体分析・執筆（author-style スキル）

著者の文体を分析してガイド化する `author-style-analyzer` と、そのガイドを使って著者らしい文章を書く `author-style-writer` の2スキルがある。仕組みと役割分担は [`author-style-skills.md`](./author-style-skills.md) を参照。

`author-style-analyzer` は、複数の役割（各分析担当・反証／境界レビュー担当・統合担当）が独立分析と反証レビューを行う構成で、**Workflow ツールによる決定論的オーケストレーション**で実行する。正典スクリプトは `.claude/skills/author-style-analyzer/references/analysis-workflow.js`。

#### 2つのモード（根拠モード／発見モード）

「新しく書いた記事が既存ルールを支持するか記録する」ことと「溜まった根拠からガイドを見直す」ことは別の作業なので、手順が分かれている。**`--discover` を付けなければ根拠モード**。

|                    | 根拠モード（既定）             | 発見モード（`--discover`）        |
| ------------------ | ------------------------------ | --------------------------------- |
| 目的               | 記事が既存ルールを支持するかを記録 | ガイドそのものを見直す            |
| 書き込み先         | `evidence/` のみ               | 本体・`evidence/`・`pending/` の3層 |
| ガイド本体         | 触らない（確度の降格を除く）   | 更新する                          |
| 新しい特徴         | `pending/` へ1行で積む         | 昇格・採用を判断する              |
| 境界レビュー       | 実行しない                     | 実行する                          |
| 記事指定なしの実行 | 不可                           | 可（棚卸しのみ）                  |
| エージェント数     | 8体（Git履歴なしなら6体）      | 10〜13体                          |

```sh
/author-style-analyzer #cg-basics              # 根拠モード（既定）
/author-style-analyzer #cg-basics --discover   # 発見モード
/author-style-analyzer --discover              # 棚卸しのみ（記事を読まない）
```

- **記事を公開した直後は根拠モードで足りる。** 軽く速く、ガイド本体が動かないので差分レビューも要らない。
- **根拠モードでも発見は起きる。** 変わるのは「見つけた特徴をその場で本体に入れるかどうか」だけで、根拠モードでは `pending/` に積み、採用の判断を発見モードへまとめる。
- 根拠モードの完了報告には**昇格候補の件数と未処理の保留件数**が必ず入る。閾値を超えていれば発見モードの実行が促される。
- 記事を追加せずガイドだけ整理したいときは `--discover` を単独で使う（`pending/` の昇格候補と支持記事数の集計だけで棚卸しする）。

補助スクリプト（`scripts/style-*.mjs`）は、ルールIDの採番・`evidence/` の機械生成・支持記事数の集計・昇格候補の抽出を担う。**数える・書き写すといった作業をエージェントにさせないための分担**なので、これらはメインセッションが Bash で実行する。

#### 実行方式と有効化

以前は Agent Teams（teammates）で実行していたが、teammate 同士のピア通信がアイドル・デッドロックでハングしやすかったため、Workflow ベースへ移行した。**特別な有効化設定は不要**。スキル実行時にメインセッションがスコープを解決し、`references/analysis-workflow.js` を Workflow で実行する。

- **推奨 effort は Opus の `high`**（`xhigh` にする必要はない）。分析の質を左右する重い思考（独立分析・反証・境界・統合）は Workflow 内の各エージェントに `effort` が固定されており、**セッションの effort を継承しない**。そのためセッションを `xhigh` へ上げても成果物は良くならず、スコープ解決や報告などメインループ側の処理が重く・遅くなるだけ。`high` で実行するのが費用対効果の面で最適。
- 制御フローが JS のため**ハングしない**。各エージェントは構造化出力を返して終了し、待機プロセス（idle teammate）が残らない。
- **引数なしの全記事一括分析は行わない**。分析対象はスキル引数（`#id`／slug をカンマ区切りで複数・混在指定できる）で必ず絞る。全記事を対象にしたい場合はカテゴリ／セクション単位のチャンクに分割して順に実行する。記事を1本も指定しない実行が許されるのは `--discover` 単独（棚卸しのみ）のときだけ。
- **進捗は文体解析タスクリスト `writing-guides/STYLE-ANALYSIS-TASKLIST.md` で追う**（`ogimage/OGP-TASKLIST.md` と同じ運用）。記事ごとの `[x]`／`[ ]`／`[draft]`／`[ページ未作成]` を、スキルへ渡せるスコープ（`#<id>`）の見出しごとにまとめてある。スキルは実行前にここで未分析かどうかを確認し、実行後に分析した記事の行を `[x]` へ更新する。
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
- **prepare-link-targets** — 記事のキーワードからリンク先ページを洗い出し、リンク先が無いものだけ雛形を作成
  - `/prepare-link-targets <キーワード一覧>`（読点・カンマ・空白区切り）
  - `/prepare-link-targets <記事slug／タイトル／ルート> <キーワード一覧>` — 対象記事を明示（所属ユニットと既存リンクを踏まえて分類する）
  - キーワードを4種に分類する：**A** 本文で扱う概念（別ページにしない）／**B** 既存ページ（雛形ページも含む。ルートがあるのでリンクできる）／**C** 一覧に下書きリンクはあるがページ未作成（**雛形を作る**）／**D** 一覧に未登録（報告のみ。YAML へのエントリ新設はしない）
  - 対応表の合意を得てから、C の項目を `create-cg-page` / `create-color-theory-page` / `create-color-fields-page` の手順で起こし、最後に `sync-tasklists.mjs --write` を1回実行する
  - 記事本文は書き換えない（本文の執筆とリンクの差し込みは `author-style-writer`）

### 記事執筆・文体（author-style）

- **author-style-writer** — 著者らしい文体で本文を生成／編集／推敲・レビュー（引数はいずれも省略可。省略時は文脈から対象を特定）
  - `/author-style-writer <slug>` — 生成モード（草稿執筆）
  - `/author-style-writer <slug> <編集指示>` — 編集モード（既存本文に手直し）
  - `/author-style-writer <slug> <keywords(カンマ区切り)>` — 指定キーワードを必ず織り込んで生成
- **author-style-analyzer** — 過去記事とGit履歴を分析し文体ガイドを更新（引数任意。全記事一括分析は行わない）
  - 引数は**カンマ区切りのリスト**で、各要素は `#<id>`（先頭が `#`）または slug のいずれか。`#id` と slug は混在・複数指定できる（見つからない要素は報告し、残りで続行）
  - `/author-style-analyzer #<id>` — YAMLの当該id配下の実装済み記事を分析（根拠モード。`evidence/` のみ更新）
  - `/author-style-analyzer <slug1>,<slug2>,…` — 指定 slug の記事を分析
  - `/author-style-analyzer #<id1>,<slug1>,#<id2>,…` — `#id` と slug を混在させて複数指定（各要素を解決して統合・重複排除）
  - `/author-style-analyzer <対象> --discover` — 発見モード。記事を分析したうえで、保留の昇格・新規ルールの採用・確度の見直しまで行う（本体・`evidence/`・`pending/` の3層を更新）
  - `/author-style-analyzer --discover` — 記事を読まず、保留の昇格候補と支持記事数の集計だけで棚卸しする
  - `/author-style-analyzer` — 引数なし。範囲指定を促す（`#id`／slug の指定を求める）
  - 分析済みの記録は `writing-guides/STYLE-ANALYSIS-TASKLIST.md`。実行後にスキルが該当行を `[x]` に更新する（根拠モードでも付ける。記事の分析は完了しているため）

### 記事の編集指示（ディレクティブの一括対応）

- **apply-edit-requests** — 記事に残っている `:::Add` / `:::Delete` / `:::Fix` をまとめて片付ける（1回の実行で1記事だけ）
  - `/apply-edit-requests <記事slug>` — 対象記事を指定（3ルートを横断して実体を解決。0件・複数ヒットは確認して止める）
  - `/apply-edit-requests` — 引数なし。セッションの文脈から対象を特定（特定できなければ尋ねる）
  - 種別と `target` で担当を振り分ける：`:::Add` / `:::Delete` / `:::Fix{target="text"}` は `author-style-writer` の**編集モード（E3以降）**、`:::Fix{target="svg"}` は `svg-diagram-component` の**コンポーネント仕様**、`:::Fix{target="demo"}` は `add-threejs-demo` の**実装規約**（新規作成の手順・デモ案の提案フェーズは使わない）
  - 検出した全ブロックを表（種別・位置・指示・担当・対応方針）で提示し、**承認を得てから一括実行**する。曖昧な指示は解釈を併記してこの時点でまとめて確認する
  - 処理順は「文章系を上から順 → SVG → デモ」。文体ガイドは最初に1回だけ読み、全ブロックで共有する
  - 対応が済んだブロックは本文から取り除く（`:::Add` は書いた文章に置換、`:::Delete` は囲んだ記述ごと削除、`:::Fix` はブロックのみ削除）。**見送ったブロックは残して理由を報告する**
  - `:::Todo`（図版・デモの新規プレースホルダ）と `::ComingSoon` は対象外。読み飛ばし、消さない
  - `author-style-writer` の編集モードと同じく文体ガイドを使って書くため、**推奨 effort は `xhigh`**（→「author-style-writer の推奨 effort」）
  - コミットはしない（`/commit-this` に渡す。著者の指示に基づく修正なので `[ai-draft]` は付かない）

### 記事の記法整備

- **format-math-notation** — 既存記事の本文を `writing-guides/math-notation-guide.md`（数式・インラインコードの記法）に沿って整える
  - `/format-math-notation <記事slug>[,<記事slug>…]` — 対象記事を指定（3ルートを横断して実体を解決。0件・複数ヒットは確認して止める）。複数渡しても**1記事ずつ**承認・報告する
  - `/format-math-notation` — 引数なし。セッションの文脈から特定し、できなければベースライン（`app/.textlintignore`）に残っている記事の一覧を出して尋ねる
  - **既存記事は記法パスのベースラインで対象外**なので、`--ignore-path /dev/null` を付けて対象記事だけを検査する（`npm run lint:svx` では緑に見えてしまう）。`npm run lint:svx:fix` は全記事に及ぶため使わない
  - textlint が見る4ルール（数字・関数名・インラインコードの前後・インライン数式の前後）は `--fix` で当て、**それ以外**（インライン数式とインラインコードの選択・記事全体での統一・文単位の統一・`\dfrac`・プライム記号 `^{\prime}`・ブロック数式の改行・`:Anki[]` 内の数字）は grep と通読で拾って手作業で直す
  - 修正方針を表（行・現在・直した後・根拠・自動修正／手作業）で提示し、**承認を得てから**本文を書き換える。判断が分かれるものは候補を併記して確認し、迷ったものは直さず保留として報告する
  - **記法だけを直し、文章・構成・強調（`:Anki[]` / `:Mark[]`）・図版・デモには触らない。** 表記揺れ（`prh.yml`）も対象外で、件数の報告だけにする
  - 違反0になったら `app/.textlintignore` から**その記事の行だけ**を外す（保留が残る場合は外さない）。コミットはしない（`/commit-this`）

### 記事の公開

- **publish-article** — 記事を公開した（`draft: true` を外した）ときの公開時タスクを実行（手順の正典。→「記事の公開（draft を外したとき）」）
  - `/publish-article <記事slug|ルート>` — 手順0〜4（ゲート → `visual` フラグ → 文体解析タスクリストの `[draft]` 解除 → OGP画像 → 残タスクの案内）
  - `/publish-article <記事slug> --before-commit` — ゲート＋`visual`＋タスクリストまで（OGPは飛ばす）。`commit-this` がコミット前に呼ぶ
  - `/publish-article <記事slug> --ogp` — OGP画像だけ。`commit-this` がコミット後に呼ぶ
  - `/publish-article` — 引数なし。未コミットの差分から `draft: true` が消えた記事を探す（見つからなければ尋ねる）
  - 記事は slug でもルート（`/cg/rendering/hidden-surface-removal-methods`）でも渡せる。カンマ・空白区切りで複数可
  - **最初に `:::Todo` / `:::Add` / `:::Delete` / `:::Fix` と `:::Action{fixme}` の残存チェック（ゲート）を行い、1件でも残っていれば公開時タスクへ進まない。** コピペで実行できる担当スキルの呼び出しを案内して止まる（自分でブロックを消したり `{fixme}` を外したり対応したりはしない）
  - `draft: true` は外さない・戻さない（公開の判断は著者）。コミット・push もしない（`/commit-this` に渡す）
  - `author-style-analyzer`（文体ガイドの更新）と `update-pr-description`（PR説明文）は自動実行せず、コマンドを添えて案内する

### 図版・コンポーネント

- **svg-diagram-component** — SVG図解コンポーネントを作成（引数構成で3パターンを自動判定）
  - `/svg-diagram-component <図の内容>` — パターンA（カテゴリは内容から判断）
  - `/svg-diagram-component [配置先ディレクトリ] <図の内容>` — パターンB（`app/src/lib/demo/<dir>/` に作成）
  - `/svg-diagram-component [配置先ディレクトリ] <図の名前> <図の内容>` — パターンC（該当ページを検索し、ページへの反映まで行う。`<図の内容>` は省略可で、省略時は図の名前自体を図の仕様として使う）
  - **このスキルに限り、配置先ディレクトリの角括弧はリテラル**（省略可を表す記法ではなく、`[munsell] マンセル色立体の水平断面図` のように実際に囲んで渡す）。囲みの無い `munsell 〜` はディレクトリ指定として扱わない
  - `<図の名前>` は `:::Todo` プレースホルダの中身をそのまま渡す（`TODO：` 接頭辞は付けない）。この文字列で `app/src/routes` 配下を検索し、**ヒットすればパターンC**（コンポーネント作成＋ページ反映）、**ヒットしなければパターンA／B**（コンポーネント作成のみ）に分岐する
- **add-threejs-demo** — CG記事に素のThree.jsのデモと、そのデモで実際に動いているコードを掲載（引数の有無と `:::Todo` の有無で3パターン）
  - `/add-threejs-demo <記事slug>`（記事に `:::Todo` あり） — パターンA-1（デモ案を提案せず、`:::Todo` の内容をそのまま実装し、ブロックを差し込みで置き換える。挿入位置は `:::Todo` の位置。`:::Todo` 通りだと懸念がある・より良い案があるときだけ、代替案を対比で示して指示を待つ）
  - `/add-threejs-demo <記事slug>`（`:::Todo` なし） — パターンA-2（記事を解析してデモ案を表で提案し、採否と挿入位置の合意を得てから1案ずつ実装）
  - `/add-threejs-demo <記事slug> <デモの内容>` — パターンB（提案フェーズを飛ばし、指定された内容のデモを実装。`:::Todo` があっても引数が優先）
  - `<記事slug>` は `app/src/routes/cg/` を検索して実体を解決する（0件・複数ヒットは確認して止める。slugが重複する場合のみ `transformation/basic-transformations` のようにユニット込みで渡す）
  - 実装先は `app/src/lib/demo/threejs/<ユニット>/<記事slug>/<デモ名>/`（`scene.ts` ＋ `<デモ名>Demo.svelte`）。renderer・描画ループ・リサイズ・Tweakpaneといった記事に載らない定型処理は `threejs/_shared/` が担う
  - 記事に加えるのは import・`<CanvasWrapper>` での使用箇所・**デモ直前の `:::Action{fixme}`**・`scene.ts` を元にした ts コードブロック（逐語一致は求めず、読者がそのまま書き下せる形に整える）・`visual: true` だけ。**地の文は書かない**（デモの説明文や本文からの言及は author-style-writer の担当。デモに触れるのは `:::Action` の中だけに閉じる）
- **svelte-component-guideline** — Svelteコンポーネント実装時に参照するガイドライン（引数なし）
- **css-styling-guideline** — CSS記述時に参照するガイドライン（引数なし）

### OGP画像

- **generate-ogp-image** — 指定ページのOGP画像（1200×630 PNG）を生成し、記録・マニフェスト・`ogimage/OGP-TASKLIST.md` を更新
  - `/generate-ogp-image <スラッグ>` — 対象ルートを指定（glob 可。例 `/color-theory/*`）
  - `/generate-ogp-image <自然言語の条件>` — 「図版のないページ」など。対象ルート一覧に解決して提示し、承認を得てから生成する
  - `/generate-ogp-image <スラッグ> <図版パス>` — 図版（png/jpg/svg/webp）を埋め込む（図版の要否は確認しない）
  - `/generate-ogp-image <スラッグ> <図版パス> <all|background>` — 白背景の透過モードを指定（白背景かの画像解析・透過の確認をスキップ。`all`＝全ての白／`background`＝背景に繋がった白だけ。要 ImageMagick）
  - 引数の判別：`all`／`background` は透過モード、画像拡張子付きは図版パス、残りが対象指定
  - draft ページは glob・条件からの展開では除外する（単一スラッグで明示指定したときだけ生成）
  - テンプレートのリデザイン後の一括再生成はスキル不要（`node ogimage/regenerate.mjs`）
  - **公開済み（非 draft）の記事にデモを追加したときは、`/commit-this` が検出して OGP 画像を再生成するか確認する**（画像に埋め込んだ図版が記事の中身と合わなくなるため）。再生成するかは著者が決め、デモの画面写真は手渡しの PNG で受け取る。OGP が未生成の記事は確認の対象外（`ogimage/OGP-TASKLIST.md` の `[ ]` が受け持つ）

### 設計・仕様・保守

- **spec-sparring** — 新機能の仕様を対話で壁打ちし `spec/` へ書き出す
  - `/spec-sparring <機能名>`（必須。無ければ対象をユーザーに尋ねる）
- **design-doc-updater** — 実装を分析し `DESIGN.md` を更新（引数任意。スコープ指定。複数はカンマ／空白区切り）
  - `/design-doc-updater` — 引数なし。全観点を分析し `DESIGN.md` 全体を差分更新
  - `/design-doc-updater <コンポーネント名／ディレクトリ名／ブランチ名／観点>` — 指定範囲に限って分析・加筆修正
- **repository-structure** — リポジトリ構造定義書を更新するためのガイドライン（引数なし）
- **add-notation-rule** — 記事本文の表記揺れ辞書（`app/textlint/prh.yml`）に項目を追加
  - `/add-notation-rule <直す前 -> 直した後>[, …]` — 矢印は `->` / `→` / `=>`、複数ペアはカンマ・読点・改行区切り（例: `この時 -> このとき, 例えば -> たとえば`）
  - `/add-notation-rule` — 引数なし、または向きが読めない指定は尋ねる（どちらの表記に寄せるかを決めるのは著者）
  - 既存記事での出現を `grep` で調べ、別語の一部になる誤検出（`この時` に対する `この時代` など）を否定先読みで絞ったパターンと `specs`（置き換わる例・**置き換わらない**例）を設計し、**承認を得てから**辞書に追記する
  - **表記揺れの検査はベースライン（`.textlintignore`）の対象外で全記事に効く。** `npm run lint:svx:notation` で自己テストと検出件数を確認し、既存記事を一括修正するか辞書追加だけに留めるかを確認してから `--fix` する（修正後は `git diff` で属性・props への誤置換を確認）
  - 辞書を列挙している `app/textlint/README.md` の表と、`author-style-writer` / `author-style-skills.md` の記述を追随させる（6件以上になる場合は列挙をやめて表を参照させる）
- **update-pr-description** — PRのタイトルと説明文を変更内容に合わせて更新（引数任意）
  - `/update-pr-description <PRのURL>` — 指定したPRを対象にする
  - `/update-pr-description` — 引数なし。現在チェックアウト中のブランチに紐づくPRが対象（PRが無ければ促す）
  - svxの差分から `draft: true` を外して公開された記事を検出し、カテゴリ別に説明文へリストアップする
  - 公開した記事ごとに、公開後の人手作業（`visual` フラグ・OGP画像・文体ガイドの更新）のチェックリストを付ける（`visual: true` の有無・`ogimage/data/<route>.json` の有無・`writing-guides/` の根拠への記載から判定してチェック済みにする）

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
