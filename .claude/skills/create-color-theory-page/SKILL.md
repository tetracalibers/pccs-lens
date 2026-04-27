---
name: create-color-theory-page
description: `app/src/routes/color-theory` 配下に新しい色の理論ページの雛形を作成するスキル。引数で受け取ったタイトルから slug を考え、ディレクトリと `+page.svx` を作成し、`color-theory/+page.svx` の該当する `:PageDraft` を `:PageLink` に置き換える。色の理論一覧から下書きページを「実装に着手する」段階で使用する。
---

# 色の理論ページ作成スキル

`app/src/routes/color-theory` 配下に、引数で受け取ったタイトルに対応する新しいページ雛形を作成するためのスキルです。

`app/src/routes/color-theory/+page.svx`（色の理論一覧）に `:PageDraft` として記載されている下書きページを、実際の `+page.svx` ファイルとして起こす作業を自動化します。

## 入力

- **ページタイトル**（必須）: `app/src/routes/color-theory/+page.svx` に存在する `:PageDraft` の `title` と完全に一致する日本語タイトル。

## 手順

### 1. slug を考える

引数で受け取った日本語タイトルから、ページの slug を考えます。

slug の命名ルール:

- 英語の kebab-case（小文字とハイフンのみ）
- 日本語タイトルの意味を反映した、検索しやすい英語表現にする
- 既存ページのスラッグ命名に揃える（例: `hue-tone-difference`, `gradient-color-scheme`, `natural-harmony`, `chevreul-color-harmony` など）
- 短すぎず長すぎず、ページ内容を端的に表すものにする

slug を決定したら、`app/src/routes/color-theory/` 配下に同名のディレクトリが既に存在しないことを確認すること。存在する場合は別の slug を検討する。

### 2. `:PageDraft` を `color-theory/+page.svx` から探す

`app/src/routes/color-theory/+page.svx` を読み込み、引数で受け取ったタイトルと完全に一致する `title` を持つ `:PageDraft` を探します。

例:

```
- :PageDraft{title="マンセル表色系" grades="2"}
```

該当する `:PageDraft` が見つからない場合は、その旨をユーザーに伝えて処理を中止する。

### 3. `grades` と `basic` を取得する

手順 2 で見つけた `:PageDraft` の `grades` 属性の値を記憶する。

例: `grades="2"` → `"2"`、`grades="2,uc"` → `"2,uc"`、`grades="3,2"` → `"3,2"`

加えて、`:PageDraft` に `basic` 属性が付いているかも記憶する（値なしのフラグ属性として扱う）。

例:

- `:PageDraft{title="..." grades="3" basic}` → `basic` あり
- `:PageDraft{title="..." grades="2"}` → `basic` なし

### 4. ディレクトリと `+page.svx` を作成する

`app/src/routes/color-theory/<slug>/` ディレクトリを作成し、その直下に `+page.svx` を作成する。

ファイルの内容は次のフォーマットに従う。`grades` の配列要素は手順 3 で取得した値から作る（カンマ区切りを配列に変換）。`basic` が付いていた場合は frontmatter に `basic: true` を `grades:` の直下（空行を挟まずに）追加する。付いていない場合は `basic:` の行は記述しない。

`basic` あり:

```
---
layout: guide-content
title: <引数で受け取ったタイトル>

grades: [<grades の値を配列にしたもの>]
basic: true

draft: true
---

## :WithGradeTag[TODO]{grades="<grades の値そのまま>"}

```

`basic` なし:

```
---
layout: guide-content
title: <引数で受け取ったタイトル>

grades: [<grades の値を配列にしたもの>]

draft: true
---

## :WithGradeTag[TODO]{grades="<grades の値そのまま>"}

```

#### 具体例

引数のタイトルが `マンセル表色系`、対応する `:PageDraft` が `:PageDraft{title="マンセル表色系" grades="2"}`（`basic` なし）の場合:

```
---
layout: guide-content
title: マンセル表色系

grades: ["2"]

draft: true
---

## :WithGradeTag[TODO]{grades="2"}

```

引数のタイトルが `色の面積比による配色`、対応する `:PageDraft` が `:PageDraft{title="色の面積比による配色" grades="3" basic}` の場合:

```
---
layout: guide-content
title: 色の面積比による配色

grades: ["3"]
basic: true

draft: true
---

## :WithGradeTag[TODO]{grades="3"}

```

`grades="2,uc"` の場合は `grades: ["2", "uc"]`、`grades="3,2"` の場合は `grades: ["3", "2"]` となる。

### 5. `:PageDraft` を `:PageLink` に置き換える

`app/src/routes/color-theory/+page.svx` 内の手順 2 で見つけた `:PageDraft` 行を、次の形式の `:PageLink` に置き換える（インデントは元の行に合わせる）。

```
- :PageLink{slug="<手順 1 で決めた slug>"}
```

## 注意事項

- slug は一度決めたら、`+page.svx` のファイル内容、ディレクトリ名、`:PageLink` の `slug` 属性ですべて同一の値を使うこと。
- 雛形を書き込んだ後の作業（具体的な内容の執筆）はこのスキルの対象外。`draft: true` のまま残し、雛形を作成したことだけをユーザーに報告する。
- 置き換え後、`color-theory/+page.svx` の同セクション内に `:PageDraft` から `:PageLink` への置き換えが正しく反映されていることを確認する。
