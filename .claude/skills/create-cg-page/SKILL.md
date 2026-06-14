---
name: create-cg-page
description: `app/src/routes/cg` 配下に新しいCGページの雛形を作成するスキル。引数で受け取ったタイトルから slug を考え、ディレクトリと `+page.svx` を作成し、`app/src/lib/content-pages/cg.yaml` の該当する `CgDraftLink` エントリを `PageLink` に置き換える。CG一覧から下書きページを「実装に着手する」段階で使用する。
---

# CGページ作成スキル

`app/src/routes/cg` 配下に、引数で受け取ったタイトルに対応する新しいページ雛形を作成するためのスキルです。

`app/src/lib/content-pages/cg.yaml`（CG一覧のデータ）に `CgDraftLink`（`title` と `group` を持つエントリ）として記載されている下書きページを、実際の `+page.svx` ファイルとして起こす作業を自動化します。

> **補足:** 色の理論ページを作成する場合は `create-color-theory-page` スキルを使うこと。本スキルは CG（`cg.yaml` / `app/src/routes/cg`）専用です。両者の違いは、ページのメタ情報が「級（`grades`）」ではなく「分野（`group`）」である点です。`group` は `"CG"`（コンピュータグラフィックス）と `"ImgP"`（画像処理）の配列です（画像処理単独のページは別途作成予定のため、本スキルでは扱いません）。

## 入力

- **ページタイトル**（必須）: `app/src/lib/content-pages/cg.yaml` に存在する `CgDraftLink` の `title` と完全に一致する日本語タイトル。

## 手順

### 1. slug を考える

引数で受け取った日本語タイトルから、ページの slug を考えます。

slug の命名ルール:

- 英語の kebab-case（小文字とハイフンのみ）
- 日本語タイトルの意味を反映した、検索しやすい英語表現にする
- 既存ページのスラッグ命名に揃える（例: `image-digitization`, `vector-and-raster`, `coordinate-systems`, `affine-transformation` など）
- 短すぎず長すぎず、ページ内容を端的に表すものにする

slug を決定したら、`app/src/routes/cg/` 配下に同名のディレクトリが既に存在しないことを確認すること。存在する場合は別の slug を検討する。

### 2. `CgDraftLink` エントリを `cg.yaml` から探す

`app/src/lib/content-pages/cg.yaml` を読み込み、引数で受け取ったタイトルと完全に一致する `title` を持つエントリを探します。

`CgDraftLink` エントリの形（slug を持たず、`title` と `group` を持つ）:

```yaml
        - title: 画像のデジタル化
          group: ["CG", "ImgP"]
```

`group` が 1 つだけの例:

```yaml
        - title: カメラでの撮影とCG
          group: ["CG"]
```

該当する `CgDraftLink` エントリが見つからない場合は、その旨をユーザーに伝えて処理を中止する。

### 3. `group` を取得する

手順 2 で見つけたエントリの `group` 配列を記憶する。

例:

- `group: ["CG"]` → `group` = `["CG"]`
- `group: ["CG", "ImgP"]` → `group` = `["CG", "ImgP"]`

`group` の各要素は `"CG"` または `"ImgP"` のいずれか。これ以外の値が入っていた場合は、その旨をユーザーに伝えて確認する。

### 4. ディレクトリと `+page.svx` を作成する

`app/src/routes/cg/<slug>/` ディレクトリを作成し、その直下に `+page.svx` を作成する。

ファイルの内容は次のフォーマットに従う。`group` には手順 3 で取得した配列をそのまま書く。

```
---
layout: guide-content
title: <引数で受け取ったタイトル>

group: [<group 配列をそのまま記述>]

draft: true
---

## TODO

```

#### 具体例

引数のタイトルが `画像のデジタル化`、YAML エントリが `title: 画像のデジタル化 / group: ["CG", "ImgP"]` の場合:

```
---
layout: guide-content
title: 画像のデジタル化

group: ["CG", "ImgP"]

draft: true
---

## TODO

```

引数のタイトルが `カメラでの撮影とCG`、YAML エントリが `title: カメラでの撮影とCG / group: ["CG"]` の場合:

```
---
layout: guide-content
title: カメラでの撮影とCG

group: ["CG"]

draft: true
---

## TODO

```

### 5. YAML の `CgDraftLink` エントリを `PageLink` に置き換える

`app/src/lib/content-pages/cg.yaml` 内の手順 2 で見つけた `CgDraftLink` エントリ（`title` / `group` の 2 行）を、次の形式の `PageLink`（1 行）に置き換える。インデント（リスト先頭の `-` の位置）は元のエントリに合わせる。

```yaml
        - slug: <手順 1 で決めた slug>
```

#### 置き換えの例

```yaml
# Before
        - title: 画像のデジタル化
          group: ["CG", "ImgP"]

# After
        - slug: image-digitization
```

## 注意事項

- slug は一度決めたら、`+page.svx` のファイル内容、ディレクトリ名、YAML の `slug` フィールドですべて同一の値を使うこと。
- `group` の値（`["CG", "ImgP"]` など）は、`+page.svx` のフロントマターと一致させること。一覧ページ（`/cg`）のタグ表示はページのフロントマターの `group` を参照する。
- 雛形を書き込んだ後の作業（具体的な内容の執筆）はこのスキルの対象外。`draft: true` のまま残し、雛形を作成したことだけをユーザーに報告する。
- 置き換え後、`cg.yaml` の同セクション内で `CgDraftLink` から `PageLink` への置き換えが正しく反映されていることを確認する（前後のエントリの位置がずれていないこと、`group` 行の取り残しがないこと）。
- 作業後は `app` ディレクトリで `npm run check` を実行し、エラー・警告が出ないことを確認する。
