# OGP画像

## OGP画像生成の仕組み

- スキル経由でページを指定し、ローカルスクリプトを実行して手動生成する
- 生成された画像をapp内の適切なディレクトリに配置し、metaタグで参照する

### スキルの動作概要

- 引数としてページスラッグを受け取る（ワイルドカードを含めることで複数ページに対応可）
- そのスラッグに対応するページを探し、メタ情報（ページタイトル、ページ階層など）を取得
- ページタイトルが長い場合、改行位置をユーザーに提案する
- nested-figを適用できるスラッグの場合は、図をOGP画像に含めるかユーザーに確認する
  - ページがsvxファイルの場合は、そこでimportされている図版を一覧で示す

### スクリプト引数

1. ページスラッグ
2. 図解SVGをレンダリングするsvelteファイル or 画像（optional、nested-fig適用スラッグ以外では無視される）

### スクリプトの技術選定

- ページタイトルなどを埋め込んだSVG文字列をJSで組み立て、resvg-jsでPNG化
- サイトで使用されているfontをそのまま利用（ローカルにフォントファイルのダウンロードが必要？）
- svelteファイルをレンダリングしてSVGにするコンパイラ等も必要？

### スクリプトの構成

- `proto/ui-patterns`のように、依存も`ogimage`ディレクトリ内で独立管理する
  - satoriやreact依存を他のディレクトリに波及させない

### SVGテンプレート

全バリエーションのOGP画像のデザインはClaude Designで作成し、`ogimage/template`にSVGとして書き出し済み

- テキストなどを埋め込みたい箇所はプレースホルダーになっている
- 必ずしも現ファイルのまま使う必要はない

拡張が必要な箇所：
- `crumb`の数は可変にする必要がある
- `title`は文字数によってはtspanによる改行対応が必要（改行位置はスキル側で決める）
- nested-figの図版はimage要素に`figureSrc`を指定する形になっているが、image要素ではなくsvg要素をそのまま埋め込んだりした方がいい場合もあるかも
- フォント適用も対応が必要

## OGP画像のバリエーション

### default

- メイン：サイト名

### title-only

- メイン：ページタイトル
- フッター：サイト名

### nested

- メイン：ページタイトル
- ヘッダー：パンくずリスト
- フッター：サイト名

### nested-fig

- メイン：ページタイトル＋図版
- ヘッダー：パンくずリスト
- フッター：サイト名

## ページごとの使用バリエーション

- トップページ
  - slug：`/`
  - ogp：default
- 歩き方ページ
  - slug：`/concept`
  - ogp：title-only
- 一覧ページ
  - slug：`/color-theory`, `/color-fields`, `/jis-color-map`, `/cg`, `/patterns`
  - ogp：title-only
- コンテンツページ
  - slug：`/color-theory/*`, `/color-fields/*`
  - ogp：nested, nested-fig（ページ内に登場する図版をoptionalで入れられる）
- CGコンテンツ
  - slug：`/cg/*`, `/cg/**/*`
  - ogp：nested
- 色系統ごとの慣用色名マップ
  - slug：`/jis-color-map/<color>/`
  - ogp：nested-fig（慣用色名マップのプレビューを入れる）
- すべての慣用色名一覧
  - slug：`/jis-color-map/all`
  - ogp：title-only
- ゲーム
  - slug：`/games/*`
  - ogp：title-only
- ツール
  - slug：`/approximate`, `/analyze`
  - ogp：title-only
- 配色シミュレータ
  - slug：`/patterns/*`
  - ogp：nested-fig（バウハウス風のプレビューを入れる）
