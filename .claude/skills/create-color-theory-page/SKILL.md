---
name: create-color-theory-page
description: `app/src/routes/color-theory` 配下に新しい色の理論ページの雛形を作成するスキル。引数で受け取ったタイトルから slug を考え、ディレクトリと `+page.svx` を作成し、`app/src/lib/content-pages/color-theory.yaml` の該当する `DraftLink` エントリを `PageLink` に置き換える。色の理論一覧から下書きページを「実装に着手する」段階で使用する。
---

# 色の理論ページ作成スキル

`app/src/routes/color-theory` 配下に、引数で受け取ったタイトルに対応する新しいページ雛形を作成するためのスキルです。

`app/src/lib/content-pages/color-theory.yaml`（色の理論一覧のデータ）に `DraftLink`（`title` と `grades` を持つエントリ）として記載されている下書きページを、実際の `+page.svx` ファイルとして起こす作業を自動化します。

## 入力

- **ページタイトル**（必須）: `app/src/lib/content-pages/color-theory.yaml` に存在する `DraftLink` の `title` と完全に一致する日本語タイトル。

## 手順

### 1. slug を考える

引数で受け取った日本語タイトルから、ページの slug を考えます。

slug の命名ルール:

- 英語の kebab-case（小文字とハイフンのみ）
- 日本語タイトルの意味を反映した、検索しやすい英語表現にする
- 既存ページのスラッグ命名に揃える（例: `hue-tone-difference`, `gradient-color-scheme`, `natural-harmony`, `chevreul-color-harmony` など）
- 短すぎず長すぎず、ページ内容を端的に表すものにする

slug を決定したら、`app/src/routes/color-theory/` 配下に同名のディレクトリが既に存在しないことを確認すること。存在する場合は別の slug を検討する。

### 2. `DraftLink` エントリを `color-theory.yaml` から探す

`app/src/lib/content-pages/color-theory.yaml` を読み込み、引数で受け取ったタイトルと完全に一致する `title` を持つエントリを探します。

`DraftLink` エントリの形（slug を持たず、`title` と `grades` を持つ）:

```yaml
        - title: マンセル表色系
          grades: ["2"]
```

該当する `DraftLink` エントリが見つからない場合は、その旨をユーザーに伝えて処理を中止する。

### 3. `grades` を取得する

手順 2 で見つけたエントリの `grades` 配列を記憶する。

例:

- `grades: ["2"]` → `grades` = `["2"]`
- `grades: ["3", "2"]` → `grades` = `["3", "2"]`
- `grades: ["2", "uc"]` → `grades` = `["2", "uc"]`

手順 4 で `:WithGradeTag` に渡すために、`grades` 配列のCSV表記（配列要素を `,` で連結した文字列）も控えておく。

例: `["3", "2"]` → `"3,2"`、`["2", "uc"]` → `"2,uc"`

### 4. ディレクトリと `+page.svx` を作成する

`app/src/routes/color-theory/<slug>/` ディレクトリを作成し、その直下に `+page.svx` を作成する。

ファイルの内容は次のフォーマットに従う。`grades` には手順 3 で取得した配列をそのまま書く。`:WithGradeTag` の `grades` 属性には CSV 表記を渡す。

```
---
layout: guide-content
title: <引数で受け取ったタイトル>

grades: [<grades 配列をそのまま記述>]

draft: true
---

## :WithGradeTag[TODO]{grades="<grades の CSV 表記>"}

```

#### 具体例

引数のタイトルが `マンセル表色系`、YAML エントリが `title: マンセル表色系 / grades: ["2"]` の場合:

```
---
layout: guide-content
title: マンセル表色系

grades: ["2"]

draft: true
---

## :WithGradeTag[TODO]{grades="2"}

```

`grades: ["2", "uc"]` の場合は frontmatter も `grades: ["2", "uc"]`、`:WithGradeTag` は `grades="2,uc"` となる。`grades: ["3", "2"]` の場合は frontmatter も `grades: ["3", "2"]`、`:WithGradeTag` は `grades="3,2"` となる。

### 5. YAML の `DraftLink` エントリを `PageLink` に置き換える

`app/src/lib/content-pages/color-theory.yaml` 内の手順 2 で見つけた `DraftLink` エントリ（`title` / `grades` の 2 行）を、次の形式の `PageLink`（1 行）に置き換える。インデント（リスト先頭の `-` の位置）は元のエントリに合わせる。

```yaml
        - slug: <手順 1 で決めた slug>
```

#### 置き換えの例

```yaml
# Before
        - title: マンセル表色系
          grades: ["2"]

# After
        - slug: munsell-color-system
```

## 注意事項

- slug は一度決めたら、`+page.svx` のファイル内容、ディレクトリ名、YAML の `slug` フィールドですべて同一の値を使うこと。
- 雛形を書き込んだ後の作業（具体的な内容の執筆）はこのスキルの対象外。`draft: true` のまま残し、雛形を作成したことだけをユーザーに報告する。
- 報告の最後に、本文の草稿執筆へ進むための `author-style-writer` スキルの呼び出し方を、**手順 1 で決めた実際の slug を埋め込んで**明記する。例（`<slug>` は具体的な文字列に置き換える）:

  ```
  /author-style-writer <slug>
  ```

  たとえば slug が `munsell-color-system` なら `/author-style-writer munsell-color-system` と案内する。
- 置き換え後、`color-theory.yaml` の同セクション内で `DraftLink` から `PageLink` への置き換えが正しく反映されていることを確認する（前後のエントリの位置がずれていないこと）。
