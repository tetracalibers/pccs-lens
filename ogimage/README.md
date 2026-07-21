# ogimage

Color Prism の **OGP / Twitter Card 画像**（1200×630 PNG）を、テンプレート SVG から手動生成するツール。

app の Svelte/Vite 実行環境からは**独立**しており、依存もこのディレクトリ内で完結する。SSR やヘッドレスブラウザは使わず、`resvg-js` で SVG → PNG 化する。

通常は Claude スキル **`generate-ogp-image`** から駆動する（ページ探索・タイトル/パンくず解決・改行提案・図版の要否確認といった知能層はスキルが担う）。このスクリプトは受け取った確定値をテンプレートに流し込んで PNG 化しつつ、確定値の**記録**（`data/`）と図版の**永続コピー**という簿記を行う。

スキルが解決した確定値は `data/<route>.json` に**記録**として永続化され、`npm run regenerate` で**対話ゼロの一括再生成**ができる。テンプレートをリデザインしても、全ページ分の対話（改行提案・図版手渡し）をやり直さずに済む。

## セットアップ（初回）

```sh
cd ogimage
npm install      # @resvg/resvg-js, picomatch, wawoff2
npm run fonts    # Google Fonts / OFL からフォント実体を fonts/ に取得
```

> **任意**: 図版の白背景を透過する `knockoutWhite` オプション（後述）を使う場合のみ、**生成時のローカル依存**として ImageMagick 7（`magick`）が要る（例: `brew install imagemagick`）。使わなければ不要。一括再生成（`regenerate`）・CI は ImageMagick 非依存。

`npm run fonts` が取得するフォント（すべて OFL）:

- **Zen Kaku Gothic New** 500/700 … 日本語（500=タグライン/crumb 日本語部分、700=タイトル）。完全版の静的 TTF を google/fonts ミラーから取得（css2 の subset だと日本語カバレッジが欠けるため）。
- **SUSE Mono** 500 … 英字ロゴ「Color Prism」（サイト実表示に合わせて 500）。
- **Reddit Mono** 500 … crumb のラテン部分。

> SUSE Mono / Reddit Mono は可変フォントで配布されており、resvg は可変フォントのウェイト選択を解決できない（既定インスタンス＝細字になる）。そのため Fontsource のウェイト確定済み静的インスタンス（woff2）を取得し、`wawoff2` で TTF へ展開している（resvg は woff2 を読めない）。
> さらに Fontsource の静的インスタンスはファミリー名に既定インスタンス名が混入している（例: `SUSE Mono Thin ExtraBold` / `Reddit Mono Medium`）ため `font-family` でマッチせずフォールバックしてしまう。`lib/rename-font.mjs` で name テーブルのファミリー名を `SUSE Mono` / `Reddit Mono` に正規化して保存する（ウェイト＝OS/2 は保持）。同じ理由で Zen Kaku Gothic New Medium(500) も `Zen Kaku Gothic New` に正規化する。

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

サイト既定画像は専用スクリプトでも生成できる（`ogimage/` から実行。`template/default.svg` を編集したら再実行で上書き）:

```sh
cd ogimage
npm run default-image   # → app/static/ogp/default.png を生成・上書き
```

### 一括再生成（`npm run regenerate`）

`data/` の記録を読み、route から `config.mjs` でバリエーションを引き直して**記録のある全ページ**を再生成する。対話・コード走査は一切しない（描画専用の自動化）。

```sh
# 記録のある全ページ + default.png を再生成（マニフェストは記録の全集合から rebuild）
node ogimage/regenerate.mjs
# または: cd ogimage && npm run regenerate

# glob で部分再生成（マニフェストは upsert＝対象外ページの項目を消さない）
node ogimage/regenerate.mjs '/color-theory/*'
# npm 経由で引数を渡すときは -- が必要: npm run regenerate -- '/color-theory/*'
```

- **記録があるページ＝再生成対象**。記録の存在そのものがレジストリで、別インデックスは持たない。新規/未生成ページはスキルでの初回生成が必要。
- **頑健モード**：per-page でエラーを握って続行し、最後に「成功 N 件 / 失敗 M 件 ＋ 失敗一覧」を報告する（1 ページの不備で全体を止めない）。単発の `render.mjs` は逆に fail-fast。
- **マニフェスト**：全再生成は記録の全集合から rebuild（削除ページの項目を自己修復で落とす）。部分再生成は成功分のみ upsert。
- ページを削除したら、記録（`data/<route>.json`）・図版アセット（`data/assets/<route>/`）・出力 PNG を**手動削除**する（全再生成でマニフェストは自己修復）。

### JSON（1 件）

| フィールド      | 必須                   | 説明                                                                                                                                                      |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variation`     | ○                      | `default` / `title-only` / `nested` / `nested-fig`                                                                                                        |
| `route`         | ○（default 以外）      | マニフェスト用キー & 出力パス算出（例: `color-theory/pccs-basics`）                                                                                       |
| `title`         | ○（default 以外）      | og:title 用の完全なタイトル（改行なし・サイト名サフィックス無し）                                                                                         |
| `titleLines`    | ○（default 以外）      | 描画用の改行済みタイトル（1〜2 要素）                                                                                                                     |
| `crumbs`        | ○（nested/nested-fig） | パンくずラベル配列（可変個）                                                                                                                              |
| `figure`        | ○（nested-fig）        | 図版画像のパス（実行時 cwd 基準。png/jpg/svg/webp）。`data/assets/<route>/figure.<ext>` へコピーされ、記録には永続パスが書かれる                          |
| `knockoutWhite` | 省略可                 | `true` で nested-fig の **PNG** 図版の「背景に繋がった白」を透過してから埋め込む（装飾背景に馴染ませる）。**生成時に ImageMagick が必要**。省略時 `false` |
| `magickFuzz`    | 省略可                 | `knockoutWhite` 時の `-fuzz` 値（例 `"5%"`）。縁の抜け具合を調整。省略時 `"5%"`                                                                           |
| `out`           | 省略可                 | 出力先。省略時は `app/static/ogp/<route>.png`                                                                                                             |

配列 or `{ "items": [ ... ] }` を渡すと一括生成。`variation` が `default` 以外なら、生成のたびに記録 `data/<route>.json` が書かれる（title-only も書く。書かないと一括再生成のスイープから漏れるため）。

#### 白背景のノックアウト（透過）

白背景の図版を nested-fig にそのまま埋め込むと、装飾背景の上に白い「箱」として浮く。`knockoutWhite: true` を付けると、埋め込み前に ImageMagick の flood-fill で **背景に繋がった白だけ**を透過し、装飾背景に馴染ませる（内部で囲まれた白＝白抜き文字・白い塗りは残る）。透過した PNG を埋め込みつつ `data/assets/<route>/figure.png` にも永続コピーするので、**記録には透過フラグを持たせない**。一括再生成（`regenerate`）は保存済みの透過アセットをそのまま使い ImageMagick を再実行しない（**regenerate・CI は ImageMagick 非依存**）。

- **生成時に ImageMagick 7（`magick`）が必要**（例: `brew install imagemagick`）。未導入で `knockoutWhite: true` を使うと明確なエラーで停止する。
- PNG 図版のみ対応（jpg/svg/webp に付けるとエラー）。
- `magickFuzz`（既定 `"5%"`）でアンチエイリアスや微妙な off-white の吸収量＝縁の抜け具合を調整する。

### オプション

- `--input <file>` / `--json <str>` / 標準入力 … 入力の与え方
- `--manifest <path>` … マニフェストの出力先を上書き（既定: `app/src/lib/meta/og-manifest.json`）
- `--no-manifest` … マニフェストを更新しない
- `--data <dir>` … 記録・図版アセットの保存先を上書き（既定: `ogimage/data/`）
- `--no-record` … 記録を書き込まない（描画のみ）
- `--fonts <dir>` … フォントディレクトリを上書き（既定: `ogimage/fonts/`）

## 構成

```
ogimage/
  config.mjs              正典設定（ルート → バリエーション/図版可否）。スキルも参照する単一の情報源
  render.mjs              描画スクリプト（CLI エントリ。単発/部分・fail-fast）
  regenerate.mjs         一括再生成スクリプト（CLI エントリ。記録のある全ページ・robust）
  lib/
    text.mjs             XML エスケープ・概算幅測定・複数行レイアウト（再センタリング＋自動縮小）
    build-svg.mjs        テンプレートのプレースホルダ埋め（LAYOUT にバリエーション別座標を集約）
    render-core.mjs      描画＋簿記コア（render.mjs / regenerate.mjs が共有する prepareItem / renderPrepared）
    record.mjs           記録（data/<route>.json）の読み書き・図版の永続コピー・記録の列挙
    knockout.mjs         figure PNG の背景白を透過（ImageMagick flood-fill・生成時のみ）
    fonts.mjs            fonts/ のフォント収集
    manifest.mjs         マニフェストの読み書き（upsert / rebuild・冪等・キー昇順）
    rename-font.mjs      TTF の name テーブルのファミリー名を正規化（フォント取得時に使用）
  template/*.svg         4 バリエーションのテンプレート（<!--TITLE--> / <!--CRUMBS--> / <!--FIGURE-->）
  scripts/download-fonts.mjs   フォント取得（npm run fonts）
  data/                  記録（正）。<route>.json と assets/<route>/figure.<ext>（コミット対象）
  fonts/                 フォント実体（コミット対象）
```

## 出力とアプリ連携

- PNG は `app/static/ogp/<route>.png`（route を入れ子ミラー）に出力。トップは `default.png`。
- **記録（正）**は `ogimage/data/<route>.json`。図版は `ogimage/data/assets/<route>/figure.<ext>` に永続コピーされる。この記録集合が一括再生成の唯一の情報源。
- マニフェスト `app/src/lib/meta/og-manifest.json` は記録からの**派生物**（「生成済みルート → タイトル」）。全再生成で記録の全集合から rebuild され、単発・部分生成では upsert される。
- アプリの `<SiteMeta>`（`app/src/lib/components/SiteMeta.svelte`）がマニフェストを参照し、載っているルートは固有 og:image / og:title を、未登録は既定画像・サイト名にフォールバックする。

## データ・状態

| パス                                       | 役割                   | 追跡     |
| ------------------------------------------ | ---------------------- | -------- |
| `ogimage/data/<route>.json`                | 記録（**正**）         | コミット |
| `ogimage/data/assets/<route>/figure.<ext>` | 図版アセット（**正**） | コミット |
| `app/src/lib/meta/og-manifest.json`        | 派生（記録から導出）   | コミット |
| `app/static/ogp/<route>.png`               | 生成物（出力画像）     | コミット |

- 記録の `figure` は `ogimage/data/` 基準の相対パス。バリエーションは記録に持たず、route から `config.mjs` の `resolveVariation` で引き直す（`figure` の有無で `optional → nested-fig` を昇格）。

## 制約

- resvg（usvg）は CSS の `var()` / `light-dark()` を解決できない。埋め込む図版は自己完結（手渡し PNG）とする。
- `knockoutWhite`（白背景の透過）は **PNG 入力・生成時のローカル処理のみ**。ImageMagick 7（`magick`）を前提とし、CI では走らせない（regenerate は保存済み透過アセットを使う）。
- ヘッドレスブラウザでのスクリーンショットは行わない。
- 出力 PNG の見た目（日本語・ロゴ・crumb・図版の描画）は**ユーザーが目視確認**する。
