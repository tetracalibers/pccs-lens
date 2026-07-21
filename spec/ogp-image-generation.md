# OGP画像生成

## 目的・背景

- 各ページが SNS や検索結果で共有された際のリンクプレビュー（OGP / Twitter Card）を整備する。
- 現状、アプリには `og:` / `twitter:` メタタグが一切なく、各ページに `<title>` があるのみ。
- 画像は**手動・オンデマンドで生成**する（CI では生成しない）。Claude スキルで駆動し、ローカルスクリプトで PNG 化する。

## スコープ

### やること

- `ogimage/` 配下の生成ツール
  - ① テンプレート SVG に確定値を流し込み PNG 化する**描画スクリプト**
  - ② それを駆動する **Claude スキル**（ページ探索・メタ情報解決・改行提案・図の要否確認）
- アプリ各ページへの `og:` / `twitter:` メタタグ注入（共有コンポーネント＋ root 既定値）
- 生成済み画像を追跡する**マニフェスト**

### やらないこと（将来検討 ＝ 保留）

- `app/src/lib/demo/**` の Svelte デモコンポーネントを SSR で SVG 化する自動化
- 定型プレビュー2種（`/jis-color-map/<color>/`、`/patterns/*`）の専用作図ロジック（当面は手渡し）

## ユーザーストーリー・主要ユースケース

- 記事や機能ページを公開する前に、著者がスキルにスラッグを渡して当該ページの OGP 画像を生成し、`app/static/ogp/` に配置する。
- 新規に多数のページを追加したとき、glob で複数ページ分の OGP 画像を一括生成する。
- コンテンツページで、ページ内に登場する図版を OGP 画像に含めたい場合、著者が図版を PNG で用意して渡す。
- ビルドすると、各ページの HTML に当該ページの OGP 画像を指す絶対 URL のメタタグが出力される。未生成ページは既定画像にフォールバックする。

## 機能要件

### 責務分離

- **スキル（知能層）**：コードを読んでバリエーション・タイトル・crumb を解決し、改行位置や図の要否を判断して、確定値をスクリプトに手渡す。
- **スクリプト（描画専用）**：受け取った確定値をテンプレートに流し込み PNG 化するだけ。ページ探索やメタ抽出は行わない。

### スキルの動作

1. 引数でページスラッグを受け取る（ワイルドカード/glob を含めて複数ページに対応可）。
2. `ogimage/` の**正典設定ファイル**（glob → バリエーション種別・図の可否）を参照し、対象スラッグのバリエーションを自動判定する。
3. 対象ページのコードを読み、以下を解決する。
   - `title`：svx の frontmatter `title`、または `+page.svelte` 内の `<title>`（「 — Color Prism」等のサイト名サフィックスは除去）。
   - `crumbs`：**トップ区分＋中間カテゴリ**の祖先連鎖（title の手前まで、可変 1〜N）。既存アプリ資産（`content-pages/*.yaml` の nav 定義、`color-theory.ts` / `color-fields.ts` / `cg.ts` のカテゴリ解決ロジック等）から算出する。
4. 長いタイトルは**最大 2 行**の改行案を提示し、ユーザーの確認・修正を得る（超過時は font-size を自動縮小）。
5. nested-fig 適格ページでは、図をOGPに含めるか確認する。含める場合、ユーザーが用意した図版 PNG のパスを受け取る（svx の場合は import 済みの図版候補を一覧提示する）。
6. 確定値を **JSON（引数または標準入力）** でスクリプトに渡す。
7. 生成後、**マニフェスト**（生成済みルート一覧）を更新する。

### スクリプトの動作

- 受け取る JSON（例）：`{ variation, titleLines, crumbs, figure, out }`
  - `variation`：`default` / `title-only` / `nested` / `nested-fig`
  - `titleLines`：改行済みタイトル（配列）
  - `crumbs`：可変個の crumb ラベル配列
  - `figure`：図版 PNG のパス（optional。nested-fig 以外では無視）
  - `out`：出力先パス
- `ogimage/template/*.svg` のプレースホルダ（`{{title}}` `{{crumb1}}` `{{crumb2}}` `{{figureSrc}}` 等）を埋める。
- crumb 可変・複数行タイトルに対応する（crumb 個数に応じたセパレータ生成、複数行時の縦位置再センタリング）。
- `ogimage/fonts/` のフォント実体を読み込んでフォントを適用し、**resvg-js** で PNG 化する。
- 図版は PNG を **data URI 化して `<image>` 要素**で埋め込む。

### バリエーションと使用ページ

- バリエーション：`default`（メイン=サイト名）/ `title-only`（メイン=タイトル＋フッターにサイト名）/ `nested`（＋パンくず）/ `nested-fig`（＋図版）。
- スラッグ → バリエーションの対応は**正典設定ファイル**に定義する（draft.md の「ページごとの使用バリエーション」表を移植）。
  - トップ `/` → default
  - `/concept`、各一覧ページ（`/color-theory`, `/color-fields`, `/jis-color-map`, `/cg`, `/patterns`）、`/jis-color-map/all`、`/games/*`、`/approximate`, `/analyze` → title-only
  - `/color-theory/*`, `/color-fields/*` → nested / nested-fig（図は optional）
  - `/cg/*`, `/cg/**/*` → nested
  - `/jis-color-map/<color>/` → nested-fig（慣用色名マップのプレビュー）
  - `/patterns/*` → nested-fig（バウハウス風のプレビュー）

### 一括生成（glob）

- タイトルの改行案は**一括提示 → まとめて承認**（個別に修正可能）。
- nested-fig 適格ページは、一括処理中でも**都度、図の要否を問う**。

## 既存機能との関係・整合

- タイトルの取得元は 3 系統（svx frontmatter / `+page.svelte` の `<title>` / YAML nav）。スキルがこれらを読み分けて解決する。
- crumb はオンページのパンくず（`Breadcrumb.svelte`、`guide-content.svelte` の `parentCrumb` 算出）と整合する祖先連鎖にする。ただし OGP ではトップ区分も含める点がオンページ表示（カテゴリのみ）と異なる。
- メタタグ注入は既存の各 `<title>`（`guide-content` / `guide-map` / `concept` レイアウト、各スタンドアロンページ）と共存する。`<SiteMeta>` を導入し、root layout に既定値を置く。

## ドメインルール上の考慮

- 本機能は色分析ロジックに直接依存しない。PCCS の色相・トーン等のドメインルールとの矛盾は生じない。
- 定型プレビュー（慣用色名マップ、バウハウス風配色）は当面手渡し画像として扱うため、その描画内容はアプリ側の既存表現に準ずる。

## データ・状態

- **出力先**：`app/static/ogp/<route>.png`（route を入れ子ミラー）。例：`app/static/ogp/color-theory/pccs-basics.png`。トップは default 画像（サイト全体の既定 og:image と共用）。
- **フォント**：`ogimage/fonts/` に TTF/OTF をコミット。少なくとも Zen Kaku Gothic New 400/500/**700**、SUSE Mono、Reddit Mono を用意（テンプレートで使うウェイトに追随）。
- **正典設定ファイル**：`ogimage/` 配下に glob → バリエーション種別・図の可否を定義（機械可読な JSON/TS）。スキルが参照する。
- **マニフェスト**：生成スクリプトが「生成済みルート一覧」の JSON を `app/src/lib/`（等）へ書き出し・更新する。`<SiteMeta>` がこれを import し、載っているページのみ固有 og:image を出力、無ければ既定画像にフォールバックする。
- **依存管理**：`ogimage/` は `proto/ui-patterns` に倣って独自の `package.json` 等で依存を独立管理し、他ディレクトリへ波及させない。

## メタタグ注入

- 正規オリジン：`https://color-prism.net/`（base は空）。絶対 URL はこのオリジンから組み立てる。
- `<SiteMeta>` 共有コンポーネント＋ root layout の既定値で注入する。
- 各タグ：
  - `og:title`＝ページタイトル単体（サイト名サフィックス抜き）。default/トップは「Color Prism」。
  - `og:description`＝**サイト共通の既定文のみ**（全ページ共通）。
  - `og:image`＝pathname ＋マニフェストで解決した絶対 URL。無ければ既定画像（default バリエーション）。
  - `og:image:alt`＝タイトル（既定画像時は汎用文）。
  - `twitter:card`＝`summary_large_image`。
  - 画像サイズ：1200×630。
- draft（`draft: true` → noindex）ページは個別生成せず、既定画像にフォールバックする。

## エッジケース・異常系

- スラッグ該当なし／正典設定に規則が無い：明確なエラーメッセージで停止する。
- nested-fig 指定で図版パスが無効・不在（単一ページ時）：エラーで停止する。
- 既存画像の再生成：同一パスへ**上書き（冪等）**。
- タイトルが最大 2 行でも幅超過：font-size を自動縮小して収める。

## 非機能要件

- **アクセシビリティ**：`og:image:alt` を必ず出力する。
- **見た目確認**：出力 PNG の日本語・英字ロゴ・crumb の描画は**ユーザーが目視確認**する（自動視覚検証・ヘッドレスブラウザ導入は行わない）。
- **パフォーマンス**：手動・オンデマンド実行のため生成速度の要件は緩い。
- **保守性**：バリエーション規則は正典設定ファイルに集約し、draft.md 削除後も参照先が失われないようにする。

## 制約

- resvg（usvg）は CSS カスタムプロパティ `var()` および `light-dark()` を解決できない。埋め込む図版は自己完結（手渡し PNG）とする。
- ヘッドレスブラウザ（Playwright）でのスクリーンショット取得は行わない（環境方針との整合）。
- アプリは `@sveltejs/adapter-static`、`trailingSlash: "always"`。
- SSR を行わないため、`ogimage/` は app の Svelte/Vite 実行環境に結合しない（独立性を維持）。

## 受け入れ条件

- 代表 4 パターン（トップ=default、一覧=title-only、コンテンツ=nested、図入り=nested-fig）で PNG が `app/static/ogp/` 配下の正しいパスに生成される。
- 生成画像で日本語（Zen Kaku Gothic New）・英字ロゴ・crumb・図版が意図どおり描画される（目視）。
- 長いタイトルが最大 2 行＋必要時縮小で破綻なく収まる。
- ビルド後、各ページの HTML に正しい絶対 URL の `og:` / `twitter:` タグが出力され、未生成ページ・draft ページは既定画像にフォールバックする。
- glob 指定で複数ページを一括生成でき、改行案の一括承認が機能する。
- 生成に伴いマニフェストが更新され、`<SiteMeta>` の解決結果に反映される。

## 未確定・保留事項

- サイト共通 `og:description` の**正確な文言**（要提供）。
- 英字ロゴの font-weight 900 の実体入手（Google Fonts に該当ウェイトが無い場合、合成太字または代替の判断を実装時に行う）。
- フォントファイルの入手元・ライセンス確認（Google Fonts / OFL 想定）。
- Svelte デモの SSR→SVG 自動化（将来検討）。
- 定型プレビュー2種（`/jis-color-map/<color>/`、`/patterns/*`）の専用作図ロジック（将来検討。当面は手渡し）。
- `og:type` の扱い（既定 `website`。コンテンツページで `article` にするかは実装時判断）。
