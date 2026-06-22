---
name: create-cg-page
description: `app/src/lib/content-pages/cg/` 配下の全YAML（`basics.yaml` など）から引数のタイトルを検索し、対応するルート配下に新しいCGページの雛形（`+page.svx`）を作成するスキル。該当する `CgDraftLink` エントリを `PageLink` に置き換える。CG一覧から下書きページを「実装に着手する」段階で使用する。
---

# CGページ作成スキル

`app/src/lib/content-pages/cg/` 配下の全 YAML ファイル（`basics.yaml` / `modeling.yaml` / `transformation.yaml` / `rendering.yaml` など）に `CgDraftLink`（`title` と `group` を持つエントリ）として記載されている下書きページを、実際の `+page.svx` ファイルとして起こす作業を自動化するスキルです。

CG のコンテンツは複数の YAML ファイル（＝複数のユニット）に分割されており、各 YAML ファイルが 1 つのユニットに対応します。**ユニットの一覧ページは動的ルート `app/src/routes/cg/[slug]/` で生成され、`slug` は YAML ファイル名（`.yaml` を除いたもの）**です（例: `cg/basics.yaml` → `/cg/basics`）。下書きリンクから起こす個別ページは、**そのユニットslug配下の静的ルート `app/src/routes/cg/<slug>/<ページslug>/+page.svx`** として作成します。

> **補足:** 色の理論ページを作成する場合は `create-color-theory-page` スキルを使うこと。本スキルは CG（`app/src/lib/content-pages/cg/*.yaml` / `app/src/routes/cg/*`）専用です。両者の違いは、ページのメタ情報が「級（`grades`）」ではなく「分野（`group`）」である点です。`group` は `"CG"`（コンピュータグラフィックス）と `"ImgP"`（画像処理）の配列です（画像処理単独のページは別途作成予定のため、本スキルでは扱いません）。

## 入力

- **ページタイトル**（必須）: いずれかの `app/src/lib/content-pages/cg/*.yaml` に存在する `CgDraftLink` の `title` と完全に一致する日本語タイトル。

## 手順

### 1. `CgDraftLink` エントリを `cg/` 配下の全 YAML から探す

`app/src/lib/content-pages/cg/` 配下の**全ての** YAML ファイル（`basics.yaml`, `modeling.yaml`, `transformation.yaml`, `rendering.yaml`, およびその他の `*.yaml`）を対象に、引数で受け取ったタイトルと完全に一致する `title` を持つ `CgDraftLink` エントリを探します。

各 YAML は次の構造で、`CgDraftLink` は `sections[].links[]` の中にあります（`slug` を持たず、`title` と `group` を持つ）。`title` には行末コメント（例: `# CG 1-2-1 / ImgP 2-4`）が添えられていることがあります:

```yaml
title: CGと画像の基本
summary: デジタル画像の表現とデジタルカメラモデル
sections:
  - heading: デジタル画像の基礎
    id: digital-image
    links:
      - title: 画像のデジタル化 # CG 1-2-1 / ImgP 2-4
        group: ["CG", "ImgP"]
```

`group` が 1 つだけの例:

```yaml
      - title: カメラでの撮影とCG # CG 1-1
        group: ["CG"]
```

見つかったら、次の 4 点を記憶する:

1. **どの YAML ファイルに含まれていたか**（例: `cg/basics.yaml`）。これが対応ルート（例: `app/src/routes/cg/basics/`）を決める。**ユニットslug = ファイル名（`.yaml` を除いたもの）**。
2. エントリの **`group`** 配列。
3. エントリの **`title`**（＝引数のタイトル）。
4. `title` 行に**行末コメントが添えられている場合は、そのコメント**（`#` から行末まで）。コメントが無い場合はこの項目はスキップする。

該当する `CgDraftLink` エントリがどの YAML にも見つからない場合、または複数のファイルに重複して見つかった場合は、その旨をユーザーに伝えて処理を中止する。

`group` の各要素は `"CG"` または `"ImgP"` のいずれか。これ以外の値が入っていた場合は、その旨をユーザーに伝えて確認する。

### 2. slug を考える

引数で受け取った日本語タイトルから、ページの slug を考えます。

slug の命名ルール:

- 英語の kebab-case（小文字とハイフンのみ）
- 日本語タイトルの意味を反映した、検索しやすい英語表現にする
- 既存ページのスラッグ命名に揃える（例: `image-digitization`, `vector-and-raster`, `coordinate-systems`, `affine-transformation` など）
- 短すぎず長すぎず、ページ内容を端的に表すものにする

slug を決定したら、手順 1 で特定したルートフォルダ（例: `app/src/routes/cg/basics/`）の配下に同名のディレクトリが既に存在しないことを確認すること。存在する場合は別の slug を検討する。

### 3. ディレクトリと `+page.svx` を作成する

手順 1 で特定したルートフォルダ配下に `<slug>/` ディレクトリを作成し、その直下に `+page.svx` を作成する。

- 例: `cg/basics.yaml` で見つかった場合 → `app/src/routes/cg/basics/<slug>/+page.svx`

ファイルの内容は次のフォーマットに従う。`group` には手順 1 で取得した配列をそのまま書く。手順 1 で `title` 行に行末コメントがあった場合は、**そのコメントを `title` の値の後ろにそのまま書き写す**（YAML 側と同じ `# ...` をフロントマターの `title:` 行末に添える）。コメントが無かった場合は `title` 行にコメントを付けない。

```
---
layout: guide-content
title: <引数で受け取ったタイトル><手順 1 でコメントがあれば半角スペースを 1 つ空けてそのまま記述（例: ` # CG 1-2-1 / ImgP 2-4`）>

group: [<group 配列をそのまま記述>]

draft: true
---

## TODO

```

#### 具体例

引数のタイトルが `画像のデジタル化`（`cg/basics.yaml` に `- title: 画像のデジタル化 # CG 1-2-1 / ImgP 2-4` / `group: ["CG", "ImgP"]` で存在）の場合、`app/src/routes/cg/basics/image-digitization/+page.svx` を作成する。行末コメント `# CG 1-2-1 / ImgP 2-4` を `title` 行にそのまま書き写す:

```
---
layout: guide-content
title: 画像のデジタル化 # CG 1-2-1 / ImgP 2-4

group: ["CG", "ImgP"]

draft: true
---

## TODO

```

引数のタイトルが `カメラでの撮影とCG`（`cg/basics.yaml` に `- title: カメラでの撮影とCG # CG 1-1` / `group: ["CG"]` で存在）の場合:

```
---
layout: guide-content
title: カメラでの撮影とCG # CG 1-1

group: ["CG"]

draft: true
---

## TODO

```

### 4. YAML の `CgDraftLink` エントリを `PageLink` に置き換える

手順 1 で見つけた **その YAML ファイル**内の `CgDraftLink` エントリ（`title` / `group` の 2 行）を、次の形式の `PageLink`（1 行）に置き換える。インデント（リスト先頭の `-` の位置）は元のエントリに合わせる。

```yaml
      - slug: <手順 2 で決めた slug>
```

#### 置き換えの例

```yaml
# Before
      - title: 画像のデジタル化 # CG 1-2-1 / ImgP 2-4
        group: ["CG", "ImgP"]

# After
      - slug: image-digitization
```

`PageLink`（`slug` のみ）には行末コメントを引き継がない。手順 1 で控えたコメントは手順 3 で作成した `+page.svx` のフロントマターに既に書き写されているため、ここでは `title` 行ごと（コメントを含めて）削除する。

## 注意事項

- slug は一度決めたら、`+page.svx` のファイル内容、ディレクトリ名、YAML の `slug` フィールドですべて同一の値を使うこと。
- ディレクトリは**正しいルートフォルダ**（タイトルが見つかった `cg/*.yaml` に対応するルート＝`app/src/routes/cg/<ファイル名>/`）配下に作ること。別のルートに作らないよう注意する。
- `group` の値（`["CG", "ImgP"]` など）は、`+page.svx` のフロントマターと一致させること。一覧ページのタグ表示はページのフロントマターの `group` を参照する。
- YAML の `title` 行に行末コメント（`# CG 1-2-1 / ImgP 2-4` など）が添えられていた場合は、そのコメントを `+page.svx` フロントマターの `title:` 行末にそのまま書き写すこと（文言・記号・スペースを改変しない）。コメントが無い場合は何も付けない。
- 雛形を書き込んだ後の作業（具体的な内容の執筆）はこのスキルの対象外。`draft: true` のまま残し、雛形を作成したことだけをユーザーに報告する。
- 置き換え後、対象の `cg/*.yaml` の同セクション内で `CgDraftLink` から `PageLink` への置き換えが正しく反映されていることを確認する（前後のエントリの位置がずれていないこと、`group` 行の取り残しがないこと）。
- 作業後は `app` ディレクトリで `npm run check` を実行し、エラー・警告が出ないことを確認する。
