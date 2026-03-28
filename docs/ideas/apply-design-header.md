# デザインの反映：ヘッダー

`proto/ui-patterns/`で作成したデザインを、`app/`の本番アプリに反映する。
今回は、全ページ共通のヘッダーのデザインを対象とする。

## ヘッダー

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/+layout.svelte`
- アプリ内の反映先：`app/src/routes/+layout.svelte`

### デザイン詳細

- ヘッダー全体のデザインは`design-d/+layout.svelte`に従う
- ヘッダー内には次のアイテムを含める：
  - サイト名：
    - `design-d/+layout.svelte`の`.site-name`をそのまま使う
    - ヘッダー内の左側に寄せて配置
  - ライトモード・ダークモード切り替えボタン：
    - 詳細はセクションを分けて後述する
    - ヘッダー内の右側に寄せて配置
  - グローバルナビゲーション：
    - 詳細はセクションを分けて後述する
    - ヘッダー内の右側に寄せて配置

## ヘッダー内：ライトモード・ダークモード切り替えボタン

ヘッダー内に置かれるライトモード・ダークモード切り替えボタンのデザインや仕様を規定する。

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/switch-light-dark/+page.svelte`の`E — グロウリングアイコン`
- アプリ内の反映先：`app/src/lib/components/switch-light-dark.svelte`（新規作成）

### モード切り替え戦略

#### 方針

- デフォルトのモードはユーザー側の設定を尊重する
  - `color-scheme: light dark;`がデフォルト
- ヘッダー内の切り替えボタンでもモード切り替えを可能にする
  - JSで付与したクラス名に応じて、CSS側で`color-scheme: light;`か`color-scheme: dark;`を指定する

#### 実装詳細

- `:root`に`color-scheme: light dark;`を指定する（CSS）
- `window.matchMedia("(prefers-color-scheme: light)").matches`の結果を常に`isLight`状態として保持する（JS）
  - ユーザー設定の変更はイベントで検知し、変更されたら状態を書き換える
  - `isLight`は`switch-light-dark.svelte`のローカル状態とし、SvelteのContextなどで共有する必要はない
- `isLight`が`true`なら`.light`クラスを、`false`なら`.dark`クラスを`body`要素に付与する（JS）
- `body.light`には`color-scheme: light;`を、`body.dark`には`color-scheme: dark;`を指定する（CSS）
- `<meta name="color-scheme">`タグを、`<head>`内のすべてのCSSスタイル情報の前に追加する（HTML）
  - ページ読み込み時に画面が不要に点滅するのを防ぐため

#### モードごとの表示の定義

- モードによって異なる色は、`light-dark()`関数を使って定義する
- モードによって異なるスタイルは、`@media (prefers-color-scheme: light)`と`@media (prefers-color-scheme: dark)`内でそれぞれ指定する

## ヘッダー内：グローバルナビゲーション

ヘッダー内に埋め込むグローバルナビゲーションのデザインや仕様を規定する。

### 幅が広い画面の場合

ヘッダーの中央にリンクを一覧表示する。

- 採用するデザイン：`proto/ui-patterns/src/routes/design-d/components/global-nav/+page.svelte`の`H — ドット + テキスト階層型`

### 幅が狭い画面の場合

ヘッダーの右端にハンバーガーボタンを設置し、開閉式のオーバーレイでリンクの一覧を表示する。

- 採用するデザイン：
  - ハンバーガーボタン：`proto/ui-patterns/src/routes/design-d/components/hamburger-button/+page.svelte`の`G — スペクトラムバー`
  - オーバーレイの形式：`proto/ui-patterns/src/routes/design-d/components/header/+page.svelte`の`F - フルスクリーンオーバーレイ`
  - オーバーレイの内部：`proto/ui-patterns/src/routes/design-d/components/global-nav/+page.svelte`の`H — ドット + テキスト階層型`の`NALLOW`を開いたときの中身
