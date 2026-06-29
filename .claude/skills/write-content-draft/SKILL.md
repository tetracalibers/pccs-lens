---
name: write-content-draft
description: 引数で受け取ったslugにマッチする記事ページ（CG `app/src/routes/cg/**/<slug>/+page.svx`、色の理論 `app/src/routes/color-theory/<slug>/+page.svx`、色の活用分野 `app/src/routes/color-fields/<slug>/+page.svx`）を探し、その本文の草稿を執筆するスキル。`content-interviewer` エージェントが設計したヒアリング項目をもとにユーザーへ段階的にインタビューし、集めた情報を `content-ghostwriter` エージェントが執筆スタイルガイドに従って本文として書き込む。`create-cg-page` / `create-color-theory-page` / `create-color-fields-page` で作った雛形ページに中身を入れる段階で使用する。
---

# 記事草稿作成スキル

`create-cg-page` / `create-color-theory-page` / `create-color-fields-page` スキルで作成した記事ページの雛形（`## TODO` だけの `+page.svx`）に、**本文の草稿を執筆する**ためのスキルです。

次の3種類の記事に対応します。

| 記事の種類 | ルート | 分類（フロントマター） | 大見出しの分類タグ |
| --- | --- | --- | --- |
| CG・画像処理 | `app/src/routes/cg/**/<slug>/` | `group`（分野: `CG` / `ImgP`） | `:WithGroupTag[...]{group="{[...]}"}` |
| 色の理論 | `app/src/routes/color-theory/<slug>/` | `grades`（級） | `:WithGradeTag[...]{grades="..."}` |
| 色の活用分野 | `app/src/routes/color-fields/<slug>/` | `grades`（級） | `:WithGradeTag[...]{grades="..."}` |

記事の種類は **対象ファイルがどのルートツリーにあるか**＝**フロントマターの分類キーが `group` か `grades` か**で判別します。以降この値を `article_type`（`CG` / `color-theory` / `color-fields`）として扱い、サブエージェントへ渡します。

フローは2段階です。

1. **インタビュー**: `content-interviewer` エージェントが対象トピックを調査して**段階的なヒアリング項目**を設計し、それをもとに**メインの対話ループ（あなた）がユーザーへ実際に質問**して情報を集める。
2. **執筆**: `content-ghostwriter` エージェントが、集めた情報をもとに `.claude/skills/write-content-draft/style-guide.md` に従って本文を `+page.svx` に書き込む。

## 入力

- **slug**（必須）: 執筆対象ページのスラッグ（＝ディレクトリ名）。
  - 例: `/write-content-draft camera-capture-and-cg`
  - 引数が無ければ、ユーザーにスラッグ（または対象ページのタイトル）を尋ねる。
- **keywords**（第二引数・省略可）: 記事に含めたいキーワードをカンマ区切りで受け取る。
  - 例: `/write-content-draft camera-capture-and-cg ピンホールカメラ, 焦点距離, 被写界深度`
  - 受け取った場合は `keywords` として保持し、ステップ2（`content-interviewer`）とステップ4（`content-ghostwriter`）の両方の prompt に渡す。インタビューではこれらのキーワードを扱う観点を質問に織り込み、執筆では本文中で自然に取り上げるよう指示する。
  - 省略された場合は特に扱わない（キーワード指定なしとして進める）。

## なぜインタビューをメインループで行うのか

`content-interviewer` はサブエージェントであり、**ユーザーと直接対話できません**。そのため `content-interviewer` は「何を・どの順で聞くか」という**インタビュー計画（質問リスト）**を返すだけにし、**実際のヒアリング（質問の提示と回答収集）はこのスキルを実行するあなた自身がメインの対話ループで行います**。

## 手順

### ステップ1: 対象ファイルを特定し、記事の種類を判別する

1. 引数の slug を使って、3つのルートツリーを横断して `<slug>/+page.svx` を探す。

   ```bash
   find app/src/routes/cg app/src/routes/color-theory app/src/routes/color-fields -type d -name "<slug>"
   ```

   （`cg/` は `<unit>/<slug>/` の入れ子構造、`color-theory/` と `color-fields/` は直下に `<slug>/` が並ぶフラット構造。`find` はどちらも拾う。）
2. 結果に応じて分岐する。
   - **1件見つかった** → その `<slug>/+page.svx` の絶対パスを `target_file` とする。
   - **0件** → ユーザーに「該当するページが見つからない」と伝える。雛形が未作成の可能性があるため、種類に応じた作成スキル（CG は `create-cg-page`、色の理論は `create-color-theory-page`、色の活用分野は `create-color-fields-page`）で先に雛形を作るよう案内して中止する。
   - **複数件**（別ツリーに同名 slug がある等） → どれが対象か曖昧なため、候補パスを提示してユーザーに確認する。
3. `target_file` のパス（どのルートツリー配下か）から `article_type` を決める。
   - `app/src/routes/cg/...` → `article_type = CG`
   - `app/src/routes/color-theory/...` → `article_type = color-theory`
   - `app/src/routes/color-fields/...` → `article_type = color-fields`
4. `target_file` を読み、フロントマターを取得する。
   - 共通: `title` / `draft`。
   - `article_type = CG` → 分類は `group`（`["CG"]` / `["ImgP"]` / `["CG","ImgP"]`）。
   - `article_type = color-theory` / `color-fields` → 分類は `grades`（`["2"]` / `["3","2"]` / `["2","uc"]` など）。`basic: true` / `useful: true` が付いていれば控える。
   - 取得した分類を `classification`（CGなら `group`、色記事なら `grades`）として保持する。
5. `target_file` の本文（フロントマター以下）を読み、**執筆対象箇所**と**執筆済み箇所**を仕分ける（→「既存コンテンツの扱い」）。執筆対象が1つも無ければ、ファイルを編集せずに中止する（同節の最後を参照）。

### 既存コンテンツの扱い

雛形（`## TODO` だけ）ではなく、**すでに何らかの中身が書かれている**ファイルにも対応する。本文を次の2種類に仕分ける。

**執筆対象箇所**（今回の執筆で埋める）:

- 箇条書きメモ（`-` / `*` などの箇条書きで、敬体の文章になっていない覚書）
- `TODO`（雛形の `## TODO` 見出し、`<!-- TODO: ... -->` コメント、`TODO:` で始まるメモなど）
- `::ComingSoon`（未執筆を表すプレースホルダ）

**執筆済み箇所**（変更しない）:

- 敬体（です・ます調）で書かれた文章は執筆済みとみなし、**本文・表現・順序を変更しない**。

仕分けた結果に応じて次のルールに従う。

- **見出し構成は維持する。** ページ全体の見出し（`## :WithGradeTag[...]` / `## :WithGroupTag[...]` など）がすでに置かれている場合は、その構成に沿って執筆する。**見出しテキスト・見出しの順序・見出しの分類タグ（`grades` / `group`）を変更しない**。執筆対象は各見出し配下の本文を埋めることに限る。
- **元のメモはコメントで残す。** 執筆対象だった箇条書きメモ・`TODO` メモは、執筆後に削除せず **HTMLコメント `<!-- ... -->`** で囲んで（執筆した本文の直前または直後に）残す。これにより、何をもとに書いたかの手がかりを保持する。`::ComingSoon` プレースホルダはコメント化せず、本文に置き換えて消してよい。
- **執筆対象が見当たらない場合。** ファイル全体が敬体の文章で埋まっており、箇条書きメモ・`TODO`・`::ComingSoon` のいずれも無い場合は、**ファイル編集に進まず**、その旨（既に執筆済みと判断したこと）をユーザーに報告する。手直し・加筆が目的であれば `edit-content-draft` スキルの使用を提案して中止する。

仕分けた執筆対象箇所（どの見出しの下に何を書くか、もとになるメモ）を `writing_targets` として整理し、ステップ2・3・4へ引き継ぐ。

### ステップ2: インタビュー計画を作る（`content-interviewer`）

`content-interviewer` サブエージェントを起動する。

- subagent_type: `content-interviewer`
- description: `Plan interview for article draft`
- prompt: 次を明記する（独立コンテキストのため漏れなく渡す）。
  - `target_file`: ステップ1のパス
  - `article_type`: `CG` / `color-theory` / `color-fields`
  - `slug` / `title`: ステップ1で取得した値
  - `classification`: CGなら `group` 配列、色記事なら `grades` 配列（と `basic` / `useful` の有無）
  - `seed`: ユーザーが既に伝えている方向性やメモ（あれば）
  - `writing_targets`: ステップ1で仕分けた執筆対象箇所（既存の見出し構成・各見出し配下のメモ・`::ComingSoon` の位置）。既に見出しや本文の一部があるファイルでは、**既存の見出し構成に沿って**質問を設計し、執筆済み（敬体）の箇所については質問しないよう依頼する。雛形（`## TODO` のみ）の場合はアウトラインからの設計でよい。
  - `keywords`: 第二引数で受け取ったキーワード（あれば）。これらを記事に含める前提で、各キーワードを扱う観点を質問に織り込むよう依頼する。

返ってきた**インタビュー計画**（トピック要約・判明済みの前提・推奨アウトライン・段階的な質問・最低ライン）を受け取る。

### ステップ3: ユーザーへ段階的にインタビューする（メインループで実施）

`content-interviewer` の計画に沿って、**あなた自身がユーザーに質問**して回答を集める。

- **推奨アウトラインをまず提示**し、記事の方向性・節立てについてユーザーの合意を取る。ただし**既存の見出し構成がある場合は、その見出しテキスト・順序を変更しない**ことを前提に、各見出しに何を書くかを確認する。
- 執筆済み（敬体）の箇所については質問しない。執筆対象（箇条書きメモ・`TODO`・`::ComingSoon`）の埋め方に絞ってヒアリングする。
- 質問は**ステージ順**（A→B→C…）に進める。一度に大量に聞かず、段階的に進める。
- 選択肢のある質問は `AskUserQuestion` ツールを使うと答えやすい。自由記述が必要なものは通常のメッセージで尋ねる。
- 各質問には、`content-interviewer` が用意した**仮説（たたき台）を添えて**提示し、ユーザーが「それでよい」と確認するだけでも進められるようにする。
- 回答が曖昧・不足している場合はその場で掘り下げる。必要なら回答を踏まえて `content-interviewer` を再度起動し、追加の質問を設計してもらってもよい。
- 計画の「執筆を始めてよい最低ライン」を満たしたら、収集した内容を **`interview_summary` として整理**する（合意したアウトライン、各項目の回答、定義する用語、具体例、補足、図解・リンクの希望を含める）。色記事で複数の級にまたがるページの場合は、各節がどの級に対応するか（見出しの `grades` 割り当て）も整理に含める。
- 執筆に入る前に、`interview_summary` の要点をユーザーに提示して**最終確認**を取る。

### ステップ4: 本文を執筆する（`content-ghostwriter`）

ユーザーの合意後、`content-ghostwriter` サブエージェントを起動する。

- subagent_type: `content-ghostwriter`
- description: `Write article draft into +page.svx`
- prompt: 次を明記する。
  - `target_file`: ステップ1のパス
  - `article_type`: `CG` / `color-theory` / `color-fields`
  - `title` / `classification`: ステップ1の値（検証用。`article_type` に応じて `group` または `grades`(+`basic`/`useful`)）
  - `interview_summary`: ステップ3で整理した内容**すべて**（色記事で節ごとの級割り当てが決まっていればそれも）
  - `writing_targets`: ステップ1で仕分けた執筆対象箇所。既存ファイルに本文を加筆する場合は、次の制約を**明示して**渡す。
    - 既存の見出し（テキスト・順序・分類タグ）は変更せず、その構成に沿って各見出し配下の本文を埋めること。
    - 敬体（です・ます調）で書かれた既存の文章は執筆済みとみなし、変更しないこと。
    - 執筆対象だった箇条書きメモ・`TODO` メモは削除せず、HTMLコメント `<!-- ... -->` で囲んで残すこと（`::ComingSoon` プレースホルダは本文に置き換えて消してよい）。
  - `keywords`: 第二引数で受け取ったキーワード（あれば）。本文中で自然に取り上げるよう指示する。
  - `style_guide_path`: `.claude/skills/write-content-draft/style-guide.md`

返ってきた要約（書いた節、強調した用語、プレースホルダ、要確認項目）を受け取る。

### ステップ5: 報告する

1. ユーザーへ次を報告する。
   - 草稿を書き込んだファイルパスと、節立ての概要。
   - `content-ghostwriter` が挙げた**要確認項目**（推測・保留した点）。
   - `draft: true` のまま残してあること（草稿のため）。レビュー後、問題なければ `draft: true` を外して公開状態にする旨を案内する。

> **補足:** 本スキルでは `npm run check`（型チェック）は実行しない。

## 注意事項

- このスキルは**既存の `+page.svx` に本文を書く**ためのもの。雛形（`## TODO` のみ）だけでなく、箇条書きメモ・`TODO`・`::ComingSoon`・見出しだけが置かれた**書きかけのファイル**にも対応する（→「既存コンテンツの扱い」）。新規ページ（ディレクトリと雛形）の作成は `create-cg-page` / `create-color-theory-page` / `create-color-fields-page` の担当。
- ファイル全体が敬体の文章で埋まっており執筆対象（箇条書きメモ・`TODO`・`::ComingSoon`）が無い場合は、**編集に進まず**報告し、加筆・手直しが目的なら `edit-content-draft` スキルを提案する。
- 既存の見出し構成は変更しない（テキスト・順序・分類タグを保つ）。執筆対象だった箇条書きメモ・`TODO` は HTMLコメントで残す。敬体で書かれた既存文章は変更しない。
- フロントマター（`layout` / `title` / `group` / `grades` / `basic` / `useful`）は変更しない。`draft: true` は人間のレビューが済むまで残す。
- サブエージェント（`content-interviewer` / `content-ghostwriter`）は独立コンテキストで動作するため、起動ごとに必要な情報（特に `article_type` と `classification`）をすべて prompt に含める。
- 実際のユーザーへの質問は**必ずメインループ（あなた）が行う**。サブエージェントにユーザー対話をさせない。
- 執筆スタイルは `.claude/skills/write-content-draft/style-guide.md` を唯一の基準とする。記事の種類によって異なるのは大見出しの分類タグ（`:WithGroupTag` / `:WithGradeTag`）だけで、それ以外のルールは共通。
- 本スキルでは `npm run check`（型チェック）は実行しない。
