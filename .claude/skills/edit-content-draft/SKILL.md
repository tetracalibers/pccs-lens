---
name: edit-content-draft
description: 引数で受け取ったslugにマッチする記事ページ（CG `app/src/routes/cg/**/<slug>/+page.svx`、色の理論 `app/src/routes/color-theory/<slug>/+page.svx`、色の活用分野 `app/src/routes/color-fields/<slug>/+page.svx`）を探し、指示された編集を加えるスキル。実際の編集は `content-editor` エージェントが執筆スタイルガイドに従って行い、編集箇所だけでなく前後の文章・前後のセクションの「流れ」も整える。既に本文のある記事を手直しする段階で使用する。
---

# 記事編集スキル

すでに本文が書かれている記事ページに対し、**指示された編集を加える**ためのスキルです。次の3種類の記事に対応します。

| 記事の種類 | ルート | 分類（フロントマター） | 大見出しの分類タグ |
| --- | --- | --- | --- |
| CG・画像処理 | `app/src/routes/cg/**/<slug>/` | `group`（分野: `CG` / `ImgP`） | `:WithGroupTag[...]{group="{[...]}"}` |
| 色の理論 | `app/src/routes/color-theory/<slug>/` | `grades`（級） | `:WithGradeTag[...]{grades="..."}` |
| 色の活用分野 | `app/src/routes/color-fields/<slug>/` | `grades`（級） | `:WithGradeTag[...]{grades="..."}` |

記事の種類は **対象ファイルがどのルートツリーにあるか**＝**フロントマターの分類キーが `group` か `grades` か**で判別します。以降この値を `article_type`（`CG` / `color-theory` / `color-fields`）として扱い、サブエージェントへ渡します。

実際の編集は `content-editor` エージェントが担当します。`content-editor` は `.claude/skills/write-content-draft/style-guide.md` を必ず読み、スタイルガイドに従って編集し、編集箇所だけでなく**前後の文章・前後のセクションの流れ**も整えます。

新規ページの雛形作成は `create-cg-page` / `create-color-theory-page` / `create-color-fields-page`、雛形への本文の初回執筆は `write-content-draft` の担当です。本スキルは**既に本文があるページの手直し**に使います。

## 入力

- **slug**（第一引数・省略可）: 編集対象ページのスラッグ（＝ディレクトリ名）。
  - 例: `/edit-content-draft camera-capture-and-cg 導入文をもっと短くして`
  - **セッションの文脈で対象コンテンツが明確な場合は省略できる**（直前まで特定の `+page.svx` を扱っていた等）。省略され、かつ文脈からも特定できない場合は、ユーザーにスラッグ（または対象ページのタイトル）を尋ねる。
- **edit_instruction**（第二引数・必須）: 編集指示。どこを・どう変えたいか。
  - 例: `/edit-content-draft camera-capture-and-cg 「ピンホールカメラ」の節に焦点距離の説明を加筆して`
  - 引数で渡されない場合は、ユーザーに編集指示を尋ねる。

## 手順

### ステップ1: 対象ファイルを特定し、記事の種類を判別する

1. slug が渡されていれば、それを使って3つのルートツリーを横断して `<slug>/+page.svx` を探す。

   ```bash
   find app/src/routes/cg app/src/routes/color-theory app/src/routes/color-fields -type d -name "<slug>"
   ```

   - slug が省略された場合は、**セッションの文脈**から対象ファイルを特定する。特定できなければユーザーに尋ねる。
2. 結果に応じて分岐する。
   - **1件見つかった** → その `<slug>/+page.svx` の絶対パスを `target_file` とする。
   - **0件** → ユーザーに「該当するページが見つからない」と伝える。雛形が未作成の可能性があるため種類に応じた作成スキル（`create-cg-page` / `create-color-theory-page` / `create-color-fields-page`）、本文が未執筆なら `write-content-draft` を案内して中止する。
   - **複数件**（別ツリーに同名 slug がある等） → 候補パスを提示してユーザーに確認する。
3. `target_file` のパス（どのルートツリー配下か）から `article_type` を決める。
   - `app/src/routes/cg/...` → `article_type = CG`
   - `app/src/routes/color-theory/...` → `article_type = color-theory`
   - `app/src/routes/color-fields/...` → `article_type = color-fields`
4. `target_file` を読み、フロントマター（`title` / `draft` と、CGなら `group`、色記事なら `grades`(+`basic`/`useful`)）と、本文がすでに書かれていることを確認する。取得した分類を `classification` として保持する。
   - 本文がまだ雛形（`## TODO` だけ等）の場合は、編集ではなく初回執筆なので `write-content-draft` を案内して中止する。

### ステップ2: 編集指示を確定する

1. `edit_instruction` が渡されていればそれを使う。渡されていなければユーザーに尋ねる。
2. 指示が曖昧で対象箇所や変更内容が判然としない場合は、**ここでユーザーに確認**する（`content-editor` はユーザーと対話できないため、解釈の確定はメインループで行う）。

### ステップ3: 編集する（`content-editor`）

`content-editor` サブエージェントを起動する。

- subagent_type: `content-editor`
- description: `Edit article +page.svx`
- prompt: 次を明記する（独立コンテキストのため漏れなく渡す）。
  - `target_file`: ステップ1のパス
  - `article_type`: `CG` / `color-theory` / `color-fields`
  - `edit_instruction`: ステップ2で確定した編集指示（背景・意図も含めて具体的に）
  - `title` / `classification`: ステップ1で取得した値（検証用。`article_type` に応じて `group` または `grades`(+`basic`/`useful`)）
  - `style_guide_path`: `.claude/skills/write-content-draft/style-guide.md`

返ってきた要約（変更内容、流れを整えるために調整した箇所、要確認項目）を受け取る。

### ステップ4: 報告する

1. ユーザーへ次を報告する。
   - 編集したファイルパスと、何をどう変えたかの概要。
   - 流れを整えるために、指示の直接対象**以外**で調整した箇所。
   - `content-editor` が挙げた**要確認項目**（推測・保留した点）。
   - `draft: true` のまま残してあること（草稿のため）。

> **補足:** 本スキルでは `npm run check`（型チェック）は実行しない。

## 注意事項

- このスキルは**既存の本文を手直しする**ためのもの。雛形作成は `create-cg-page` / `create-color-theory-page` / `create-color-fields-page`、初回執筆は `write-content-draft` の担当。
- フロントマター（`layout` / `title`）は変更しない。`draft: true` は残す。見出しの分類タグ（`:WithGroupTag` の `group` ／ `:WithGradeTag` の `grades`）を増減した場合のみ、フロントマターの分類（`group` / `grades`）を本文中の分類タグの和集合に一致させる（`content-editor` が対応）。
- サブエージェント（`content-editor`）は独立コンテキストで動作するため、起動ごとに必要な情報（特に `article_type` と `classification`）をすべて prompt に含める。
- 編集指示の解釈が曖昧なときの確認は**必ずメインループ（あなた）が行う**。サブエージェントにユーザー対話をさせない。
- 執筆・編集スタイルは `.claude/skills/write-content-draft/style-guide.md` を唯一の基準とする（ただし同じ語の重複 `:Mark[]` は許容する）。記事の種類によって異なるのは大見出しの分類タグと、記事冒頭の導入文のテイスト（CGは読者を案内する導入、色の理論・色の活用分野は主題の概念を一言で説明する導入）だけで、それ以外のルールは共通。導入文を編集・追加する場合はスタイルガイドの「記事の冒頭（導入文）」の該当する種類の規約に従う。
