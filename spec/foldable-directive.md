# 折り畳みディレクティブ（`:::Foldable`）

## 目的・背景

CG記事では、デモの直下に Three.js の実装コードを掲載している。しかしコードが長いと地の文の流れを分断してしまい、実装に興味がない読者にとっては読み飛ばすべき塊が挟まる形になる。読者が必要なときだけ開ける形にしたい。

コードに限らず、補足的なブロック（地の文・リスト・図など）を畳めるようにしたいため、中身を問わない汎用の折り畳みとして作る。

現在は ` ```ts:Three.js ` のタブラベル（`app/src/lib/remark/code-title.js` → `figure.code-with-title.is-code`）が「これは Three.js のコードである」という情報を担っているが、折り畳みを導入したあとはその役割を折り畳みのタイトルが引き継ぐ。

## スコープ

### やること

- コンテナディレクティブ `:::Foldable{title="…"}` の新規追加
- コンポーネントの新規作成: `app/src/lib/components/m-directive/Foldable.svelte`
- `app/svelte.config.js` の `directives.container` へ `{ name: "Foldable", replaceTo: "svelte-component" }` を登録
- `app/src/lib/layouts/guide-content.svelte` のモジュールスクリプトで import・export（記事側の `import` は不要になる）
- 既存の ` ```ts:Three.js ` 5箇所を ` ```ts ` に戻し、`:::Foldable{title="Three.jsの実装概要"}` で囲む
  - `app/src/routes/cg/camera/pinhole-camera/+page.svx`（2箇所）
  - `app/src/routes/cg/modeling/shape-model-overview/+page.svx`（3箇所）
- `.claude/skills/add-threejs-demo/SKILL.md:239-241` の掲載コードの手順を新記法へ差し替える（これを更新しないと、次回のデモ追加で古い記法が使われる）

### やらないこと

- 3Dデモ（`CanvasWrapper`）を折り畳む用途への対応。`details` が閉じている間は中身が非表示のため、canvas の初期サイズが `0` になる。対応するには開いたときにリサイズを伝達する仕組みと Threlte 側の対応が必要で、検証コストが上がる
- 閉じた中身の検索性対応（`hidden="until-found"` 相当の自前実装）
- 開閉状態の永続化（`sessionStorage` 等）
- 開閉アニメーション
- `writing-guides/syntax-guide.md` への記法の追記（別作業）
- `figure.code-with-title.is-code` 機構の削除。置き換え後は未使用になるが温存する（将来 ` ```lang:title ` でコードにラベルを付けたくなったときにそのまま使えるようにするため）
- `concept.svelte` / `guide-map.svelte` への登録。現状これらのレイアウトでコードを掲載する予定がないため、`guide-content.svelte` のみに登録する（必要になった時点で追加する）

## ユーザーストーリー・主要ユースケース

- **読者**: デモを見て納得したらそのまま次の節へ進める。実装が気になったときだけタイトル行を押してコードを開く。
- **著者**: コードブロックの記法は現状のまま（` ```ts `）で書き、畳みたいものだけを `:::Foldable` で囲む。コードブロック側に特別な記法を足さない。
- **著者**: コード以外の補足ブロック（長い列挙・脱線した説明など）も、同じディレクティブで畳める。

## 機能要件

### 記法

````
:::Foldable{title="Three.jsの実装概要"}

```ts
const scene = new Scene()
```

:::
````

- 既定は**折りたたまれた状態**。最初から開いた状態で置きたいときだけ `collapsed=false` を付ける。

  ````
  :::Foldable{title="Three.jsの実装概要" collapsed=false}
  ````

- 中身は markdown として解釈される。コードブロック・地の文・リスト・図などを置ける。
- 中身のコードブロックは shiki のハイライトが保たれる（下記「検証済みの事項」）。

### コンポーネント

- ネイティブの `<details>` / `<summary>` を使う。JS ゼロ。

  ```svelte
  <details open={!isCollapsed}>
    <summary>{title}</summary>
    {@render children?.()}
  </details>
  ```

- Props
  | Props | 型 | 既定 | 説明 |
  | --- | --- | --- | --- |
  | `title` | `string` | なし（必須） | タイトル行に表示する文言 |
  | `collapsed` | `boolean \| "true" \| "false"` | `true` | 最初から折りたたまれた状態にするか |
  | `children` | `Snippet` | — | 折り畳みの中身 |

- **`collapsed` の正規化**: ディレクティブの属性値は常に文字列として渡るため（`collapsed=false` → `collapsed="false"`）、コンポーネント側で文字列 `"false"` を偽として扱う。

### 見た目

- 罫線1本の軽量型。地の文の流れを遮らないことを優先する。

  ```
  閉じた状態
  ▸ Three.jsの実装概要
  ────────────────────────────

  開いた状態
  ▾ Three.jsの実装概要
  ────────────────────────────
    const scene = new Scene()
    scene.add(mesh)
  ```

- タイトル行の行頭に開閉状態を示すマーカーを置き、タイトル行の下に罫線を1本引く。中身はその下に続く。
- タイトル行全体がクリック・タップ領域になること。
- 中身がコードブロックのとき、`guide-content.svelte` のグローバルCSS（`main :global(pre)` 等）がそのまま効く。タイトル行と中身の間隔は実装時に調整する。

## 既存機能との関係・整合

- **` ```lang:title ` のタイトル付きコードブロック**（`app/src/lib/remark/code-title.js`）は温存する。`math:` を使っている2箇所（`app/src/routes/color-theory/rgb-color-system/+page.svx`）の表示は変わらない。
- ` ```ts:Three.js ` の使用箇所は5箇所すべて廃止する。ラベルの役割は Foldable のタイトルが引き継ぐ。
- **コンポーネントの解決方法**: mdsvex はレイアウトのモジュール export を `Components.X` へ書き換えるが、対象は**ディレクティブ由来の要素ノードだけ**で、markdown 内の生タグには効かない（`app/node_modules/mdsvex/dist/main-DLA3kuAq.js:23971` の `visit(tree, 'element', …)`）。生タグの `<SVGWrapper>` `<CanvasWrapper>` が svx 側で `import` されているのはこのため。ディレクティブ形式にしたことで、記事側の `import` は不要になる。
- 属性記法は既存のディレクティブ（`:::CardGrid{cols=1}`、`:::CardGrid{lastWide}`）と同じ流儀に揃える。

## ドメインルール上の考慮

- 色の理論・PCCS の色相／トーン・色距離・配色技法のルールには触れない。記事の表示上の仕組みのみを対象とする。
- 記法・書式の正典である `writing-guides/syntax-guide.md` と矛盾する点はないが、今回は追記しない（→ やらないこと）。

## データ・状態

- 開閉状態は `<details>` のDOM状態のみ。アプリの状態管理・永続化は行わない。
- ページ再訪・再読み込み・ページ遷移で `collapsed` の既定に戻る。

## エッジケース・異常系

- **`title` 未指定**: 型上は必須。ただし svx 内の記述は型チェックの対象外なので、指定漏れがあってもビルドは通り、タイトル行が空になる。指定漏れは想定しない。
- **長いタイトル**: 折り返して2行以上になっても崩れないこと。
- **中身が空**: タイトル行だけが表示される。禁止しない。
- **Foldable の入れ子**: 想定しない。
- **閉じた中身の検索**: Safari・Firefox の `Cmd+F` では見つからない（Chrome は find-in-page で自動展開する）。割り切る。
- **印刷**: 閉じた中身は印刷されない。割り切る。

## 非機能要件

- **a11y**: ネイティブの `details` / `summary` に委ね、`aria-expanded` などは足さない。キーボード（Tab → Enter / Space）で開閉でき、スクリーンリーダーへの展開状態の通知も標準の挙動に任せる。
- **モバイル**: タイトル行全体がタップ領域になること。長いタイトルの折り返しで崩れないこと。
- **パフォーマンス**: JS ゼロ。閉じている間は中身がレンダリングされない（DOM 上には存在する）。

## 制約

- Svelte 5 / mdsvex / remark-directive。
- ディレクティブの属性値は常に文字列として渡る。値なし属性のみ裸の属性として出力され、Svelte 側で `true` として解釈される（`:::CardGrid{lastWide}` が効いているのはこの経路）。
- 開閉アニメーションは付けない（瞬時に開閉する）。

### 検証済みの事項

コンテナディレクティブの中にコードフェンスを置いた場合の mdsvex の出力を、実際に同じ remark プラグイン構成でコンパイルして確認した。

入力:

````
:::Foldable{title="Three.jsの実装概要" collapsed=false}

```ts
const scene = new Scene()
```

畳める地の文もここに置ける。

:::
````

出力（抜粋）:

```
<Foldable title="Three.jsの実装概要" collapsed="false">{@html `<pre class="shiki shiki-themes ayu-light dracula-soft" …>…</pre>` }<p>畳める地の文もここに置ける。</p></Foldable>
```

- コードフェンスはコードブロックとして解釈され、shiki のハイライトが保たれる
- `title` は文字列属性としてそのまま渡る
- `collapsed=false` は**文字列 `"false"`** として渡る（→ コンポーネント側で正規化が必要）
- 地の文との併存も問題ない

## 受け入れ条件

1. `:::Foldable{title="…"}` で囲んだコードブロックが、既定で折りたたまれた状態で表示される
2. タイトル行のクリック、またはキーボード（Tab → Enter / Space）で開き、shiki のハイライトが効いたコードが表示される（ライトテーマ・ダークテーマの両方）
3. `collapsed=false` を付けた場合は最初から開いた状態で表示される
4. 既存の ` ```ts:Three.js ` 5箇所が Foldable に置き換わり、`Three.js` のタブラベルが表示されなくなっている
5. `math:` のタイトル付き数式ブロック（`rgb-color-system`）の表示が変わっていない
6. `add-threejs-demo/SKILL.md` の手順が新記法になっている
7. `npm run check` がエラー・警告なしで通る
8. 見た目はユーザーが目視で確認して確定する

## 未確定・保留事項

- 罫線の太さ・色、開閉マーカーの形状（ネイティブの `::marker` を使うか自前で描くか）は、実装後にユーザーが目視で調整する
- 開閉アニメーション（`::details-content` + `interpolate-size`）は将来の検討事項。ブラウザ対応が新しめのため今回は入れない
- 3Dデモを畳む用途、閉じた中身の検索性、`writing-guides/syntax-guide.md` への記法追記は別途検討する
