# ogimage

Color Prism の **OGP / Twitter Card 画像**（1200×630 PNG）を、テンプレート SVG から手動生成するツール。

app の Svelte/Vite 実行環境からは**独立**しており、依存もこのディレクトリ内で完結する
（`proto/ui-patterns` と同じ方針）。SSR やヘッドレスブラウザは使わず、`resvg-js` で SVG → PNG 化する。

通常は Claude スキル **`generate-ogp-image`** から駆動する（ページ探索・タイトル/パンくず解決・
改行提案・図版の要否確認といった知能層はスキルが担う）。このスクリプトは受け取った確定値を
テンプレートに流し込んで PNG 化する**描画専用**。

## セットアップ（初回）

```sh
cd ogimage
npm install      # @resvg/resvg-js, picomatch, wawoff2
npm run fonts    # Google Fonts / OFL からフォント実体を fonts/ に取得
```

`npm run fonts` が取得するフォント（すべて OFL）:

- **Zen Kaku Gothic New** 400/500/700 … 日本語（タイトル・crumb 日本語部分）。完全版の静的 TTF を
  google/fonts ミラーから取得（css2 の subset だと日本語カバレッジが欠けるため）。
- **SUSE Mono** 800 … 英字ロゴ「Color Prism」。
- **Reddit Mono** 500 … crumb のラテン部分。

> SUSE Mono / Reddit Mono は可変フォントで配布されており、resvg は可変フォントのウェイト選択を
> 解決できない（既定インスタンス＝細字になる）。そのため Fontsource のウェイト確定済み静的インスタンス
> （woff2）を取得し、`wawoff2` で TTF へ展開している（resvg は woff2 を読めない）。

## 使い方

リポジトリのルートから、確定値 JSON を渡して実行する。

```sh
# 単一
node ogimage/render.mjs --json '{ "variation":"nested", "route":"color-theory/pccs-basics",
  "title":"PCCSと色の分類", "titleLines":["PCCSと色の分類"], "crumbs":["色の理論","PCCSと色彩調和"] }'

# ファイル / 標準入力
node ogimage/render.mjs --input payload.json
echo '<JSON>' | node ogimage/render.mjs

# サイト既定画像（トップと共用の og:image）
node ogimage/render.mjs --json '{"variation":"default","out":"app/static/ogp/default.png"}'
```

### JSON（1 件）

| フィールド | 必須 | 説明 |
| --- | --- | --- |
| `variation` | ○ | `default` / `title-only` / `nested` / `nested-fig` |
| `route` | ○（default 以外） | マニフェスト用キー & 出力パス算出（例: `color-theory/pccs-basics`） |
| `title` | ○（default 以外） | og:title 用の完全なタイトル（改行なし・サイト名サフィックス無し） |
| `titleLines` | ○（default 以外） | 描画用の改行済みタイトル（1〜2 要素） |
| `crumbs` | ○（nested/nested-fig） | パンくずラベル配列（可変個） |
| `figure` | ○（nested-fig） | 図版画像のパス（実行時 cwd 基準。png/jpg/svg/webp） |
| `out` | 省略可 | 出力先。省略時は `app/static/ogp/<route>.png` |

配列 or `{ "items": [ ... ] }` を渡すと一括生成。

### オプション

- `--input <file>` / `--json <str>` / 標準入力 … 入力の与え方
- `--manifest <path>` … マニフェストの出力先を上書き（既定: `app/src/lib/meta/og-manifest.json`）
- `--no-manifest` … マニフェストを更新しない
- `--fonts <dir>` … フォントディレクトリを上書き（既定: `ogimage/fonts/`）

## 構成

```
ogimage/
  config.mjs              正典設定（ルート → バリエーション/図版可否）。スキルも参照する単一の情報源
  render.mjs              描画スクリプト（CLI エントリ）
  lib/
    text.mjs             XML エスケープ・概算幅測定・複数行レイアウト（再センタリング＋自動縮小）
    build-svg.mjs        テンプレートのプレースホルダ埋め（LAYOUT にバリエーション別座標を集約）
    fonts.mjs            fonts/ のフォント収集
    manifest.mjs         マニフェストの読み書き（冪等・キー昇順）
  template/*.svg         4 バリエーションのテンプレート（<!--TITLE--> / <!--CRUMBS--> / <!--FIGURE-->）
  scripts/download-fonts.mjs   フォント取得（npm run fonts）
  fonts/                 フォント実体（コミット対象）
```

## 出力とアプリ連携

- PNG は `app/static/ogp/<route>.png`（route を入れ子ミラー）に出力。トップは `default.png`。
- マニフェスト `app/src/lib/meta/og-manifest.json` に「生成済みルート → タイトル」を記録。
- アプリの `<SiteMeta>`（`app/src/lib/components/SiteMeta.svelte`）がマニフェストを参照し、
  載っているルートは固有 og:image / og:title を、未登録は既定画像・サイト名にフォールバックする。

## 制約

- resvg（usvg）は CSS の `var()` / `light-dark()` を解決できない。埋め込む図版は自己完結（手渡し PNG）とする。
- ヘッドレスブラウザでのスクリーンショットは行わない。
- 出力 PNG の見た目（日本語・ロゴ・crumb・図版の描画）は**ユーザーが目視確認**する。
