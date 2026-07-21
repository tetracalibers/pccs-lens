# 全ページ OGP を静的注入で効かせる（全体プリレンダ＋ビルド後注入）

## 目的・背景

- OGP / Twitter Card のメタタグを、**全ページ**で SNS クローラ（JS 非実行）に見せられるようにする。
- 現状の問題：プリレンダされて静的 HTML になっているのは `/cg/*` のカテゴリページ26枚＋`404.html` フォールバックのみ（`cg/[slug]/+page.ts` の `prerender = true` と `entries` 由来）。他の全ルートは `adapter-static` の `fallback: "404.html"` による SPA フォールバックで配信され、OGP タグは JS 実行後にしか注入されないため、クローラには見えない。
- OGP タグは `SiteMeta.svelte` の `<svelte:head>` から出ており、静的 HTML に焼き込まれるのは **SSR が走るページだけ**。`ssr = false` のページはプリレンダしても「空シェル」しか出ず、`<svelte:head>` は描画されない。
- 制約として、**CF Worker 等のランタイムに依存したくない**（＝100% 静的ファイルで完結させたい）。`adapter-cloudflare`（edge SSR）や CF Worker + HTMLRewriter による注入は不採用。GitHub Pages はいずれ廃止予定のため、配信先としての存続は前提にしない。

## スコープ

### やること

- ルート `src/routes/+layout.ts` に `export const prerender = true` を追加し、**全ルートをプリレンダ対象**にする（各ルートが自分の `index.html` を吐くようにする）。
- 動的ルート `patterns/[theme]` / `jis-color-map/[family]` に `entries` を追加し、**全パラメータ値を列挙**してプリレンダする。
- **ビルド後注入スクリプト**（Node / `.mjs`）を追加し、`npm run build` に連結する。`build/**/index.html` を走査し、`og-manifest.json` を単一の情報源として各 `<head>` に og / twitter タグを注入する。
- `SiteMeta.svelte` の `<svelte:head>` からの OGP 出力を撤去し、OGP タグの出所を注入スクリプトに一本化する。
- 全体プリレンダ化に伴ってビルド時 SSR で落ちるページがあれば、当該ページを `ssr = false` にして回避する（OGP は注入で担保されるため実害なし）。

### やらないこと

- `adapter-cloudflare` への移行や CF Worker（`main`）の追加。ランタイム SSR は導入しない。
- `ssr = false` の対話ページ（ゲーム・ツール・デモ内蔵ページ）の**デモコンポーネントの SSR セーフ化**（本文を SSR 描画する改修は行わない。空シェルのままでよい）。
- GitHub Pages デプロイワークフロー（`.github/workflows/deploy.yml`）の撤去。廃止は別途対応とする。
- OGP 画像そのものの生成・再生成（`spec/ogp-image-generation.md` / `spec/ogp-image-regeneration.md` の領分）。本仕様は「生成済みマニフェストを、全ページの静的 HTML へどう届けるか」に閉じる。

## ユーザーストーリー・主要ユースケース

- 利用者が、これまで SPA フォールバックだったページ（例：`color-theory` のデモ内蔵ページ、`games/*`、`analyze`、`patterns/[theme]`）の URL を SNS に貼ると、JS を実行しないクローラでも当該ページ固有（またはフォールバック）の OGP カードが表示される。
- 著者が新しいコンテンツページや動的パラメータの頁を追加してビルドすると、その `index.html` に OGP タグが自動で注入される。マニフェスト未登録なら既定画像＋サイト名にフォールバックする。

## 機能要件

### 全体プリレンダ

- `src/routes/+layout.ts` に `export const prerender = true` を追加（既存の `trailingSlash = "always"` と併存）。全ルートに継承される。
- `adapter-static` の `fallback: "404.html"` は安全弁として残す。
- `prerender = true` + `ssr = false` の組み合わせは、公式ドキュメント（adapter-static / Static site generation）どおり**エラーにならず、空シェルの `index.html` を各ルートに出力する**。この挙動を前提とする。

### 動的ルートの entries 列挙

- `patterns/[theme]/+page.ts`：既存のテーマ定義（`$lib/patterns/themes`）から全 `theme` を列挙する `EntryGenerator` を追加。`ssr = false` は維持。
- `jis-color-map/[family]/+page.ts`：色みの全種別（`$lib/data/jis-colors` の `isColorFamily` の元データ）を列挙する `EntryGenerator` を追加。`ssr = false` は維持。
- `cg/[slug]` は既に `entries` あり（`cgPages` 由来）。変更不要。

### ビルド後注入スクリプト

- 形式：Node 実行の `.mjs`。`npm run build` の後段で走らせる（`vite build && node <inject>.mjs` もしくは `postbuild` 相当）。
- 入力：`build/` 配下の全 `index.html`（`404.html` を含む）と `og-manifest.json`。
- 処理：
  1. 各 HTML のファイルパス → ルートキーを求める（`build/` プレフィックスと `/index.html` サフィックスを除去。トップは `""`。`404.html` は既定扱い）。
  2. `resolveOgMeta` 相当のロジックでルートキー → メタ（`title` / `description` / `imageUrl` / `imageAlt` / `url`）を解決。マニフェスト未登録は既定画像（`ogp/default.png`）＋サイト名にフォールバック。
  3. `</head>` 直前に以下のタグ群を注入：`og:type` / `og:site_name` / `og:url` / `og:title` / `og:description` / `og:image`（＋ `og:image:width` 1200 / `og:image:height` 630）/ `og:image:alt` / `twitter:card`（現行 `SiteMeta.svelte` と同一セット）。
- 絶対 URL は常に `SITE_ORIGIN`（`https://color-prism.net`）から組み立てる（base パスに依存しない）。
- 冪等性：`<head>` に既に `og:` タグがある場合は二重挿入しない。

### SiteMeta の撤去と共有ロジック

- `SiteMeta.svelte` の `<svelte:head>` の OGP 出力を撤去する（コンポーネント自体を削除するか、空にするかは実装時判断。`+layout.svelte` の `<SiteMeta />` 参照も整理する）。
- `src/lib/meta/site-meta.ts` の解決ロジック（`resolveOgMeta` / `routeKeyFromPathname` / 各定数）は**注入スクリプトと共有**する。スクリプトが `.mjs` から取り込めるよう、共有部分を Node から import 可能な形にする（プレーン JS 化 / JSON 直読み＋ロジック再現のいずれか。実装時に決める）。

## 既存機能との関係・整合

- `spec/ogp-image-generation.md` は「アプリ各ページへの `og:` / `twitter:` メタタグ注入（共有コンポーネント＋ root 既定値）」を採用していた。**本仕様はこの注入方式を「共有コンポーネント（`SiteMeta`）」から「ビルド後注入スクリプト」へ変更する**。マニフェスト（`og-manifest.json`）を単一の情報源とする設計思想は不変で、それをビルド段へ延長する位置づけ。
- OGP 画像の生成・マニフェスト更新（`ogimage/` のスクリプト・スキル）には手を入れない。本仕様はマニフェストの**消費側**のみを変更する。
- 現状 SSR で OGP を出している `/cg/*` カテゴリ26枚は、注入方式へ移行する（出力結果は等価）。

## ドメインルール上の考慮

- 色理論・PCCS 等のドメインルールには影響しない（配信・メタタグ層の変更）。

## データ・状態

- 新たな永続データ・状態は増やさない。
- 情報源は既存の `og-manifest.json`（`{ routes: Record<routeKey, { title }> }`）と `site-meta.ts` の定数（`SITE_ORIGIN` / `SITE_NAME` / `SITE_DESCRIPTION` / 既定画像キー）。
- OGP は pathname（ルートキー）基準で解決し、クエリ文字列には依存しない。

## エッジケース・異常系

- **マニフェスト未登録ルート**：既定画像（`ogp/default.png`）＋サイト名にフォールバック。
- **トップページ（ルートキー `""`）**：既定（サイト名）扱い。現行踏襲。
- **`404.html` フォールバック**：既定 OGP を注入。プリレンダ後は実在ルートには基本ヒットせず、真に存在しない URL 用。
- **`approximate` の `?color=` 等クエリ依存ページ**：OGP は pathname 基準のため無影響。プリレンダはベース頁の空シェルのみ。
- **プリレンダ中に SSR で落ちるコンテンツページ**：当該ページを `ssr = false` にして空シェル化（OGP は注入で担保）。
- **注入の二重実行**：`og:` タグ既出なら再注入しない（冪等）。

## 非機能要件

- **ランタイム非依存**：出力は純静的ファイルのみ。CF Worker / Node サーバを要さず、任意の静的ホストで配信可能。
- **ビルド時間**：プリレンダ対象が26頁＋αから全ルート（約128頁＋動的パラメータ展開）へ増える。注入パスも加わる。許容範囲内であることを確認する。
- **アクセシビリティ / モバイル**：本変更の対象外（配信・メタ層）。

## 制約

- 技術スタック：`@sveltejs/adapter-static`（`fallback: "404.html"`）を維持。Svelte 5 / SvelteKit 2。
- `prerender = true` + `ssr = false` が空シェルを出力する挙動に依存する（公式ドキュメントで確認済み）。
- 動的ルートは `entries` 列挙が必須（全体プリレンダ下で `entries` が無いとビルドエラーになるため）。
- OGP タグの絶対 URL は常に `SITE_ORIGIN`（Cloudflare の本番オリジン）を使う。GitHub Pages 向けビルドでも同オリジンを指す（正典を CF に寄せる）。

## 受け入れ条件

- `npm run build` が成功する（プリレンダで落ちるページは `ssr = false` 化して解消済み）。
- 代表ルートの `build/<route>/index.html` の `<head>` に、ルート固有（またはフォールバック）の og タグ一式が入っている：
  - コンテンツ記事（SSR される svx 頁）
  - `ssr = false` の対話ページ（例：`games/tone-match`、`analyze`、`color-theory` のデモ内蔵頁）
  - 動的パラメータ頁（`patterns/<theme>`、`jis-color-map/<family>`）
  - `404.html`（既定 OGP）
- OGP タグの重複が無い。
- JS を無効化した状態（クローラ相当）で、以前は SPA フォールバックだったページの HTML に正しい og タグが存在することを確認できる。

## 未確定・保留事項

- `site-meta.ts` の共有ロジックを注入スクリプト（`.mjs`）から取り込む具体手段（プレーン JS 化して import するか、JSON を直読みしてロジックを再現するか）は実装時に決める。
- 注入スクリプトの配置場所・ファイル名（`ogimage/` 配下に置くか、`scripts/` か等）は実装時に決める。
- 全体プリレンダ化で `ssr = false` 化が必要になるコンテンツページの具体的な洗い出しは、実際のビルドで炙り出す（この「ビルドして落ちた頁を潰す」作業が実装の主工程）。
- GitHub Pages ワークフローの撤去は本仕様の範囲外（別途対応）。
