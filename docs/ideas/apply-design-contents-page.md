# デザインの反映：コンテンツページ

`proto/ui-patterns/`で作成したデザインを、`app/`の本番アプリに反映する。
今回は、`.svx`ファイルで書かれるページ（コンテンツページ）のデザインを対象とする。

## コンテンツページ

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/guide-2/+page.svelte`
- アプリ内の反映先：`app/src/lib/layouts/guide.svelte`

### デザイン詳細

- ページ全体のデザインは`/design-d/guide-2/+page.svelte`のスタイルに従う
- コンテンツ内の各要素についてはセクションを分けてそれぞれ後述する

## コンテンツページ内の`h1`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/guide-2/+page.svelte`の`h2`のスタイル
- アプリ内の反映先：`app/src/lib/components/m-html/Heading1.svelte`（新規作成）

## コンテンツページ内の`h2`・`h3`・`h4`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/heading/+page.svelte`の`G — ドット装飾`
- アプリ内の反映先：
  - h2：`app/src/lib/components/m-html/Heading2.svelte`
  - h3：`app/src/lib/components/m-html/Heading3.svelte`
  - h4：`app/src/lib/components/m-html/Heading4.svelte`（新規作成）

## コンテンツページ内の`ul`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/ulist/+page.svelte`の`F — ダイヤモンド`
- アプリ内の反映先：`app/src/lib/components/m-html/Ulist.svelte`

## コンテンツページ内の`:Mark`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/mark/+page.svelte`の`H — ボールド + アクセントカラー`
- アプリ内の反映先：`app/src/lib/components/m-directive/Mark.svelte`

## コンテンツページ内の`:::Example`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/tips/+page.svelte`の`G — ネオングロー背景`の`example`のスタイル
- アプリ内の反映先：`app/src/lib/components/m-directive/Example.svelte`

## コンテンツページ内の`:::Tips`

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/tips/+page.svelte`の`F — チップ型インラインラベル`の`tips`のスタイルをグレースケール化したもの
- アプリ内の反映先：`app/src/lib/components/m-directive/Tips.svelte`

## コンテンツページ内の`:::TermCard`

- `app/src/lib/components/m-directive/TermCard.svelte`のスタイルのまま変更しない
