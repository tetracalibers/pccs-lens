---
name: create-cg-page
description: `app/src/lib/content-pages` 配下の `cg-*.yaml`（cg- プレフィックス付きの全YAML）から引数のタイトルを検索し、対応するルート配下に新しいCGページの雛形（`+page.svx`）を作成するスキル。該当する `CgDraftLink` エントリを `PageLink` に置き換える。CG一覧から下書きページを「実装に着手する」段階で使用する。
---

# CGページ作成スキル

`app/src/lib/content-pages` 配下の `cg-*.yaml`（`cg-basics.yaml` / `cg-modeling.yaml` / `cg-transformation.yaml` / `cg-rendering.yaml` など、`cg-` プレフィックスが付いた全ファイル）に `CgDraftLink`（`title` と `group` を持つエントリ）として記載されている下書きページを、実際の `+page.svx` ファイルとして起こす作業を自動化するスキルです。

CG のコンテンツは複数の YAML ファイル（＝複数のページ）に分割されており、各 YAML ファイルが 1 つのルートに対応します。ルート名は YAML ファイル名から `.yaml` を除いたもので、たとえば `cg-basics.yaml` は `app/src/routes/cg-basics/` に対応します。下書きリンクから起こす個別ページは、その対応ルート配下に作成します。

> **補足:** 色の理論ページを作成する場合は `create-color-theory-page` スキルを使うこと。本スキルは CG（`cg-*.yaml` / `app/src/routes/cg-*`）専用です。両者の違いは、ページのメタ情報が「級（`grades`）」ではなく「分野（`group`）」である点です。`group` は `"CG"`（コンピュータグラフィックス）と `"ImgP"`（画像処理）の配列です（画像処理単独のページは別途作成予定のため、本スキルでは扱いません）。

## 入力

- **ページタイトル**（必須）: いずれかの `cg-*.yaml` に存在する `CgDraftLink` の `title` と完全に一致する日本語タイトル。

## 手順

### 1. `CgDraftLink` エントリを全 `cg-*.yaml` から探す

`app/src/lib/content-pages` 配下の `cg-` プレフィックスが付いた**全ての** YAML ファイル（`cg-basics.yaml`, `cg-modeling.yaml`, `cg-transformation.yaml`, `cg-rendering.yaml`, およびその他の `cg-*.yaml`）を対象に、引数で受け取ったタイトルと完全に一致する `title` を持つ `CgDraftLink` エントリを探します。

各 YAML は次の構造で、`CgDraftLink` は `sections[].links[]` の中にあります（`slug` を持たず、`title` と `group` を持つ）:

```yaml
title: CGと画像
sections:
  - heading: デジタル画像
    id: TODO
    links:
      - title: 画像のデジタル化
        group: ["CG", "ImgP"]
```

`group` が 1 つだけの例:

```yaml
      - title: カメラでの撮影とCG
        group: ["CG"]
```

見つかったら、次の 3 点を記憶する:

1. **どの YAML ファイルに含まれていたか**（例: `cg-basics.yaml`）。これが対応ルート（例: `app/src/routes/cg-basics/`）を決める。
2. エントリの **`group`** 配列。
3. エントリの **`title`**（＝引数のタイトル）。

該当する `CgDraftLink` エントリがどの `cg-*.yaml` にも見つからない場合、または複数のファイルに重複して見つかった場合は、その旨をユーザーに伝えて処理を中止する。

`group` の各要素は `"CG"` または `"ImgP"` のいずれか。これ以外の値が入っていた場合は、その旨をユーザーに伝えて確認する。

### 2. slug を考える

引数で受け取った日本語タイトルから、ページの slug を考えます。

slug の命名ルール:

- 英語の kebab-case（小文字とハイフンのみ）
- 日本語タイトルの意味を反映した、検索しやすい英語表現にする
- 既存ページのスラッグ命名に揃える（例: `image-digitization`, `vector-and-raster`, `coordinate-systems`, `affine-transformation` など）
- 短すぎず長すぎず、ページ内容を端的に表すものにする

slug を決定したら、手順 1 で特定したルートフォルダ（例: `app/src/routes/cg-basics/`）の配下に同名のディレクトリが既に存在しないことを確認すること。存在する場合は別の slug を検討する。

### 3. ディレクトリと `+page.svx` を作成する

手順 1 で特定したルートフォルダ配下に `<slug>/` ディレクトリを作成し、その直下に `+page.svx` を作成する。

- 例: `cg-basics.yaml` で見つかった場合 → `app/src/routes/cg-basics/<slug>/+page.svx`

ファイルの内容は次のフォーマットに従う。`group` には手順 1 で取得した配列をそのまま書く。

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

引数のタイトルが `画像のデジタル化`（`cg-basics.yaml` に `group: ["CG", "ImgP"]` で存在）の場合、`app/src/routes/cg-basics/image-digitization/+page.svx` を作成する:

```
---
layout: guide-content
title: 画像のデジタル化

group: ["CG", "ImgP"]

draft: true
---

## TODO

```

引数のタイトルが `カメラでの撮影とCG`（`cg-basics.yaml` に `group: ["CG"]` で存在）の場合:

```
---
layout: guide-content
title: カメラでの撮影とCG

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
      - title: 画像のデジタル化
        group: ["CG", "ImgP"]

# After
      - slug: image-digitization
```

## 注意事項

- slug は一度決めたら、`+page.svx` のファイル内容、ディレクトリ名、YAML の `slug` フィールドですべて同一の値を使うこと。
- ディレクトリは**正しいルートフォルダ**（タイトルが見つかった `cg-*.yaml` に対応するルート）配下に作ること。別のルートに作らないよう注意する。
- `group` の値（`["CG", "ImgP"]` など）は、`+page.svx` のフロントマターと一致させること。一覧ページのタグ表示はページのフロントマターの `group` を参照する。
- 雛形を書き込んだ後の作業（具体的な内容の執筆）はこのスキルの対象外。`draft: true` のまま残し、雛形を作成したことだけをユーザーに報告する。
- 置き換え後、対象の `cg-*.yaml` の同セクション内で `CgDraftLink` から `PageLink` への置き換えが正しく反映されていることを確認する（前後のエントリの位置がずれていないこと、`group` 行の取り残しがないこと）。
- 作業後は `app` ディレクトリで `npm run check` を実行し、エラー・警告が出ないことを確認する。
