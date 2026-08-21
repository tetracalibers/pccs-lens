---
name: publish-article
description: 記事を公開した（frontmatter から `draft: true` を外した）ときの公開時タスクを実行するスキル。最初に本文へ `:::Todo` / `:::Add` / `:::Delete` / `:::Fix` / `:::Pending` と `{fixme}` 付きの `:::Action` が残っていないかを確認し、残っていれば公開時タスクへ進まず、そのままコピペして実行できるスキル呼び出し（`/svg-diagram-component`・`/add-threejs-demo`・`/apply-edit-requests`）を案内して止まる。あわせて記法ゲート（`npm run lint:svx:syntax`）を当て、違反があれば `format-math-notation` を自動実行して収束させる。残っていなければ `visual` フラグの追加・文体解析タスクリストの `[draft]` 解除・OGP画像の生成を行い、自動実行しない残タスク（文体ガイドの更新・PR説明文の更新）を案内する。`commit-this` が `draft` 削除を検出したときにも呼ばれる。記事を公開したときの作業を回したい場合に使用する。
effort: high
---

# 記事公開作業スキル (publish-article)

記事を公開した（frontmatter から `draft: true` を外した）ときに回す作業一式。README「記事の公開（draft を外したとき）」の手順を、公開前のチェックから順に実行する。

- **やること**: 編集指示ディレクティブの残存チェック（ゲート） → **記法ゲート**（`lint:svx:syntax` と、違反があれば `format-math-notation` の自動実行） → `visual` フラグの追加 → 文体解析タスクリストの `[draft]` 解除 → OGP画像の生成 → 自動実行しない残タスクの案内。
- **やらないこと**: `draft: true` を外す／戻す（公開の判断は著者）。コミット・push（`/commit-this` の担当）。`author-style-analyzer`・`update-pr-description` の自動実行（→ 手順4）。**ゲートに引っかかったディレクティブを自分の判断で消す・対応する**（→ 手順0）。

## 入力

```
/publish-article [<記事slug|ルート>...] [--before-commit | --ogp]
```

- **記事の指定（省略可・複数可）** — slug（`hidden-surface-removal-methods`）またはルート（`/cg/rendering/hidden-surface-removal-methods`）。カンマ・空白区切りで複数渡せる。

  省略時は、未コミットの差分から `draft: true` が消えた記事を探す。

  ```sh
  git diff HEAD --name-only -- app/src/routes | grep '+page.svx$'
  ```

  ```sh
  # 上で出た各ファイルについて、draft: true が消えているかを見る
  git diff HEAD -- <file> | grep -E '^[-+]draft: *true'
  ```

  `-draft: true` があり `+draft: true` が無いものが対象。見つからなければセッションの文脈から特定し、それでも決まらなければユーザーに尋ねる。

- **フェーズ指定（省略可）** — `commit-this` から呼ばれるときに使う。

  | 指定 | 実行する範囲 |
  | --- | --- |
  | 省略（既定） | 手順0〜4すべて |
  | `--before-commit` | 手順0〜2（ゲート・記法ゲート・`visual`・タスクリスト）。手順3（OGP）は飛ばす |
  | `--ogp` | 手順3（OGP）だけ |

  分かれている理由: **`visual` フラグとタスクリストの書き換えは記事と同じコミットに載せる**必要があり、**OGPの生成物は記事とは別コミットにする**のがこのリポジトリの慣例。コミットを作る側（`commit-this`）が、コミットを挟んで前半と後半を呼ぶ。

### 対象記事の解決

slug で渡された場合は3ルートを横断して実体を探す。

```sh
find app/src/routes/cg -maxdepth 2 -type d -name "<記事slug>"
find app/src/routes/color-theory app/src/routes/color-fields -maxdepth 1 -type d -name "<記事slug>"
```

- **0件なら該当ページが無い旨を伝えて中止する。複数件なら候補パスを提示して確認する。** 推測でどれかに決めない
- ルート表記は `app/src/routes` を除いたパス（`app/src/routes/cg/rendering/hidden-surface-removal-methods/+page.svx` → `/cg/rendering/hidden-surface-removal-methods`）。タスクリストとOGPの引数で使う
- **対象記事に `draft: true` がまだ残っている場合は、公開時タスクを実行しない。** 手順0のチェックだけ行って結果を報告し、公開してよいか（`draft` を外すか）をユーザーに確認する。**このスキルが `draft` を外すことはしない**

## 手順

### 0. 編集指示ディレクティブの残存チェック（ゲート）

**公開時タスクより先に必ず行う。** `:::Todo` / `:::Add` / `:::Delete` / `:::Fix` / `:::Pending` は読者に見える形で表示されるため、残したまま公開してはいけない（`writing-guides/syntax-guide.md` ルール4）。`{fixme}` の付いた `:::Action`（AIが書いたまま人手が入っていないデモ誘導文）も同じ扱いで止める。

```sh
grep -nE '^:{3,}(Todo|Add|Delete|Fix|Pending)' <対象の .svx>
grep -nE '^:{3,}Action\{[^}]*fixme' <対象の .svx>
```

- ディレクティブは**入れ子のとき外側のコロンが増える**ので `:{3,}` で拾う。コードフェンス（` ``` `）の中の例示は除く
- **1件も無ければ手順1へ進む。**
- **1件でもあれば、公開時タスクを実行しない。** `visual` フラグもタスクリストもOGPも触らず、下の案内を出して止まる
- `::ComingSoon`（未執筆の節）が残っていれば報告に添える。**ゲートで止めるのは上の5種＋`:::Action{fixme}`** で、`::ComingSoon` は報告だけにとどめる

#### 案内の出し方（そのままコピペして実行できる形）

残っていたブロックの種別から担当スキルの呼び出しを組み立て、**1行1コマンドのコードブロック**で出す。ユーザーが上から順にコピペするだけで対応に入れる形にする。

| 残っていたもの | 案内するコマンド |
| --- | --- |
| `:::Todo`（SVG図解） | `/svg-diagram-component <Todoブロックの中身>` — ブロックごとに1行 |
| `:::Todo`（Three.jsデモ） | `/add-threejs-demo <記事slug> <Todoブロックの中身>` — ブロックごとに1行 |
| `:::Add` / `:::Delete` / `:::Fix` | `/apply-edit-requests <記事slug>` — **何件あっても1行**（一括で対応するスキルのため） |
| `:::Pending` | 案内するコマンドは無い。**採否は著者が決める**ので、該当箇所（行番号と冒頭）を挙げて、採用（ブロックだけ外す）か不採用（囲んだ記述ごと削除）かを確認する |
| `:::Action{fixme}` | **文面を直すのは著者**なので、該当箇所（行番号と Action の文面全文）を挙げて、直したうえで `{fixme}` を外すよう促す。直す必要が無ければ `{fixme}` だけ外せばよいことも添える。文面の案が欲しい場合の選択肢として `/refine-action-text <記事slug>` も案内するが、**このスキルを通しても `{fixme}` は残る**（ゲートは著者が `{fixme}` を外して初めて通る）ことを添える |

- **`:::Todo` の中身はそのまま渡す。** `TODO：` のような接頭辞を付けない（`svg-diagram-component` はこの文字列でプレースホルダを検索するため、1文字でも変えると突き合わせが外れる）。中身が複数行のときは1行に詰める
- `:::Todo` が図解かデモかは中身から判断する。座標・グラフ・分類のような静的な図は `svg-diagram-component`、3次元・視点移動・パラメータ操作が要るものは `add-threejs-demo`。**判断がつかないときは両方の行を並べ、どちらで作るか選んでもらう**
- 記事slugは「対象記事の解決」で確定した実体を使う。CG記事で slug が重複する場合は `transformation/basic-transformations` の形で渡す
- 出力例:

  ```
  /svg-diagram-component 水晶体分光透過率のグラフ
  /add-threejs-demo hidden-surface-removal-methods Zバッファ法の深度比較
  /apply-edit-requests hidden-surface-removal-methods
  ```

- 案内には、**対応するかブロックを外すかの2択がある**ことも添える（syntax-guide ルール4）。ただし**自分の判断でブロックを消さない。** ユーザーが「外して」と言った場合だけ消す
- **`:::Action{fixme}` の `{fixme}` を自分で外さない。** 「人手が入った」ことの印なので、AIが外すと印の意味が消える。ユーザーが「外して」と言った場合だけ外す
- **対応が済んだら `/publish-article <slug>` をもう一度実行する**ことを案内に含める。記事がすでにコミット済みなら、`visual` フラグとタスクリストの書き換えは後追いの別コミットになる
- `commit-this` から呼ばれている場合は、**ゲートで止まったこととこの案内をそのまま返す**（呼び出し元はコミットを続け、報告に案内を載せる）

### 0.5. 記法ゲート（`lint:svx:syntax`）

ディレクティブの残存チェックを通ったら、**公開する記事に記法パスを当てる。**

```sh
cd app
npx textlint --rulesdir textlint/rules src/routes/<...>/+page.svx
```

- **ベースライン（`app/.textlintignore`）は効かせる**（`--ignore-path /dev/null` は付けない）。ベースラインに載っている記事はそもそも強制の対象外なので、ここは素通りしてよい（整備は `format-math-notation` の担当）
- **0件なら手順1へ進む。**
- **1件でもあれば、`format-math-notation` を `--auto` で自動実行する**（案内して止めるのではない）。

  ```
  /format-math-notation <記事slug> --auto
  ```

  `syntax` パスには**自動修正できるルールしか置かれていない**（`app/textlint/README.md`「組織原則」）ので、`--fix` を収束させれば必ず0件になる。決定的な変換しかしないため、ここで承認を挟まなくてよい。差分は `commit-this` のコミット許可プロンプトで人間が確認する。
- **ディレクティブのゲートとは扱いが違う。** ディレクティブは図版・デモという創作作業を要求するので案内して止まるが、記法は決定的な変換で片付くのでその場で直す。
- **書き換えたファイルは報告に挙げる**（呼び出し元が「記法を整備」の独立コミットにする。→ `commit-this` 手順1.5）。**このスキルはコミットしない。**
- **advisory の残件（`npm run lint:svx:advisory`）は報告するが、公開を止めない。**

  ```sh
  cd app
  npx textlint --rulesdir textlint/rules-advisory --ignore-path /dev/null src/routes/<...>/+page.svx
  ```

  囲む範囲の判断（`3DCG` など）・降格候補・`\dfrac` への組み直しが出る。いずれも判断が要るので、`/format-math-notation <slug>`（`--auto` なし）で任意のタイミングに片付ける。
- **記法整備タスクリスト（`writing-guides/NOTATION-TASKLIST.md`）にチェックは付けない。** `--auto` は自動修正だけを当てて advisory の判断をしないので、実行済みには数えない（`[x]` を書くのは `--auto` なしの `format-math-notation` だけ）。公開後も `[ ]` のまま残るのが正しい。手順3の残タスクの案内に、`/format-math-notation <slug>` で片付けられることを添える。

### 1. `visual` フラグを追加する（コミット前に済ませる）

`visual` は記事の `.svx` 自身を書き換えるので、**記事と同じコミットに載る**ように、コミット前のこの段階で済ませる。

```sh
grep -q '\$lib/demo/' <file>        # 図解コンポーネントを使っているか
grep -qE '^visual: *true' <file>    # すでにフラグがあるか
```

- **図解あり かつ フラグ無し** → frontmatter に `visual: true` を追加する。位置は `grades:` 行の直後（`grades:` が無いページは `group:` 行の直後、どちらも無ければ frontmatter を閉じる `---` の直前）
- **図解なし** → 何もしない。判定に使うのは `$lib/demo/` の import だけで、**Mermaid 図だけのページにはフラグを付けない**運用
- **すでにフラグがある** → 何もしない

書き換えたファイルは報告に挙げる（呼び出し元がコミット対象に加える）。

### 2. 文体解析タスクリストの `[draft]` を外す（コミット前に済ませる）

公開した記事は文体分析の対象になるので、`writing-guides/STYLE-ANALYSIS-TASKLIST.md` の該当行を**未分析（空チェックボックス）**へ書き換える。これも記事と同じコミットに載せる。

```sh
grep -n '<公開した記事のルート>' writing-guides/STYLE-ANALYSIS-TASKLIST.md
```

- `` - [draft] `/<route>` `` → **`` - [ ] `/<route>` ``**（`[draft]` 注釈を外すだけ。`[x]` にはしない。分析はまだ未実施）
- 記事がまだルート表記で載っておらず `- [ページ未作成] <タイトル>` の行としてしか無い場合（雛形作成から公開までを一気にやった等）は、その行ごと `` - [ ] `/<route>` `` に置き換える（並び順は動かさない）
- すでに `` - [ ] `/<route>` `` になっている、または `- [x]`（分析済み）の場合は何もしない
- **該当行を一意に特定できないときは勝手に書き換えない。** 行が見つからない／どの行か確定できない旨をユーザーへ伝え、どうするか確認を取る（推測で行を追加・移動しない）

> このファイルはドキュメント（CI 非対象）だが、記事の `.svx`（app・ビルド系）と同じコミットに載るため、`commit-this` の `[skip ci]` 判断は app 側に従って「付けない」になる。

### 3. OGP画像を生成する（コミット後）

- **`--before-commit` で呼ばれた場合はここを飛ばし、「コミット後に `--ogp` で呼び直す」ことを報告に書く。**
- 生成物は記事本文と別コミットにするのがこのリポジトリの慣例。**単独実行（フェーズ指定なし）の場合はそのまま生成してよいが、コミットはしない**（`/commit-this` に渡し、記事本文＋`visual`＋タスクリストとは別コミットに分けてもらう）。

1. **生成する。** 対象ルートを引数に `generate-ogp-image` を実行する（Skill ツール。複数記事なら1ルートずつ）。

   ```
   /generate-ogp-image /<route>
   ```

   - タイトルの改行位置・図版の要否・白背景の透過は、**そのスキルの手順に従って対話で確認する**（勝手に決めない）
   - `draft` ページは glob・自然言語指定の展開から除外されるため、**公開してから**生成する（このスキルが呼ばれる時点では `draft` は外れている）
   - `ogimage/` の依存・フォントが未整備などで生成に失敗した場合は、**未実施として報告し、手動で実行するコマンドを案内する。** ここで詰まっても記事の変更は巻き戻さない

2. **更新されるのは次の4種。** 報告に挙げて、呼び出し元がコミット対象にできるようにする。

   - `app/static/ogp/<route>.png`
   - `ogimage/data/<route>.json`（図版があれば `ogimage/data/assets/<route>/` も）
   - `app/src/lib/meta/og-manifest.json`
   - `ogimage/OGP-TASKLIST.md`

### 4. 自動実行しないものを案内する

- **文体スタイルガイドの更新（`author-style-analyzer`）は自動実行しない。** 実行コストが大きく、分析範囲の指定という判断を伴うため。人手修正のコミットを済ませてから実行するものでもある（Git履歴が根拠になる）。手順5でコマンドを添えて促すにとどめる
- **PR説明文の更新（`update-pr-description`）も自動実行しない。** push 後でないと差分がリモートに反映されないため。手順5で push 後の作業として案内する

### 5. 報告する

- **ゲートの結果**（手順0）: 残っていたディレクティブの一覧（種別・行・中身）と、組み立てた案内のコマンド。残っていなければ「残存なし」
- **記法ゲートの結果**（手順0.5）: `lint:svx:syntax` の違反件数（0件だったか、`format-math-notation --auto` を回して0件にしたか）と、書き換えたファイル。**advisory の残件**はルール別の件数と該当箇所を挙げ、`/format-math-notation <slug>` で片付けられることを添える
- **公開時タスクの実行結果**: `visual` フラグ（追加した／図解が無いので不要／すでにあった）、文体解析タスクリスト（`[draft]` を外した／該当行が無く未更新）、OGP画像（生成したルートと PNG のパス／`--before-commit` で保留／未実施ならその理由）
- **書き換えた・生成したファイルの一覧**（呼び出し元がコミット対象に使う）
- **残っている公開後タスク**（手順4）。コマンドを添える

  ```
  /author-style-analyzer <slug>
  /update-pr-description
  ```

  `author-style-analyzer` は複数記事をカンマ区切りでまとめて実行できる。`update-pr-description` は **push したうえで**実行する

- **未分析記事の残件**: 手順2で `writing-guides/STYLE-ANALYSIS-TASKLIST.md` を書き換えたら、更新後のファイルを数え直し、未分析記事の**件数とスラッグの全列挙**を示す。今回公開した記事が加わって残件が増えるので、次にどこまで `/author-style-analyzer` にかけるかの判断材料になる

  ```sh
  grep -c '^- \[ \]' writing-guides/STYLE-ANALYSIS-TASKLIST.md   # 未分析の件数
  grep -n '^- \[ \]' writing-guides/STYLE-ANALYSIS-TASKLIST.md   # 未分析のスラッグ
  ```

  - 数えるのは `- [ ]` の行だけ。`[draft]`・`[ページ未作成]` は分析対象外なので、件数にもスラッグ一覧にも含めない
  - **件数だけで済ませない。スラッグは「ほか N 件」と省略せず全件を列挙する**

## 注意事項

- **`draft: true` を外さない・戻さない。** 公開の判断は著者。まだ付いている記事を渡されたら手順0のチェックだけ行って確認する
- **記法ゲートだけは自動で直す**（手順0.5）。ディレクティブのゲートと違い、`syntax` パスは自動修正できるルールしか含まないので、`format-math-notation --auto` を回して収束させる。**advisory の指摘は自動で直さない**（判断が要るため報告だけ）
- **ゲートを自分の判断で越えない**（手順0）。ディレクティブが残っているのに公開時タスクへ進まない。残っているブロックを自分で消すことも、`:::Action` の `{fixme}` を外すことも、その場で対応してしまうこともしない（対応は案内したスキルの担当、`{fixme}` を外すのは著者）
- **コミット・push はしない。** 書き換えたファイルは報告に挙げ、`/commit-this` に渡す
- **`visual` とタスクリストはコミット前、OGP はコミット後**（手順1・2 と手順3）。順序を入れ替えると、フラグやタスクリストが記事コミットに乗らない／OGP生成物が記事本文と同じコミットに混ざる
- **タスクリストは `[draft]` → `[ ]` にとどめる。** 分析していない記事を `[x]` にすると分析済みの記録が壊れる
- OGP生成で対話が必要になっても**勝手に決めない**（改行位置・図版の要否・白背景の透過）
- **公開時タスクの構成が変わったときは、README「記事の公開（draft を外したとき）」と `commit-this`（手順1.5・5.5）の両方を更新する。** 手順の正典はこのスキル
