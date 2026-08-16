# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A prototype for generating SVG patterns with mirror symmetry — dihedral (D_n) rosettes, and all 17 wallpaper groups side by side. Part of the `pccs-lens` monorepo, located under `proto/`. This is not the main app — it's an isolated algorithm prototype. See `doc.md` for the full spec.

対称性と描き方が違う 4 つの版がある。構図・配色のルールは共通。

- **曲線版**（`src/generate.js` + `src/motif.js`）— 制御点がランダムな 3 次ベジェ曲線のロゼッタ
- **直線版 / 角ばった版**（`src/generate-angular.js` + `src/motif-angular.js`）— 折れ線・多角形のみのロゼッタ
- **壁紙群版**（`src/generate-wallpaper.js` + `src/motif-wallpaper.js`）— 平面を埋めつくす繰り返し模様。**17 の壁紙群を同じモチーフで見比べる**のが目的
- **壁紙群・丸み版**（`src/generate-wallpaper-round.js` + `src/motif-wallpaper-round.js`）— 同じ目的を、丸い図形の組み合わせで描く版

## Running

```bash
node src/generate.js                 # 曲線版・色数 2〜6 を一括生成
node src/generate-angular.js         # 直線版・色数 2〜6 を一括生成
node src/generate-wallpaper.js       # 壁紙群版・17 群 × 色数 2〜6 を一括生成
node src/generate-wallpaper-round.js # 壁紙群・丸み版（オプションは壁紙群版と共通）
node src/generate.js --n=4,24        # n = 4〜24 も範囲で一括生成（1 ディレクトリ・1 HTML）
node src/generate.js --color-count=4,5  # 生成する色数を絞る（4 つのスクリプトで共通）
node src/generate-wallpaper.js --guide  # 対称性の要素（格子・基本領域・回転中心・鏡）を重ねる
node src/generate.js --help          # オプション一覧（--help は 4 つのスクリプトで共通）
```

Output goes to `.generated/{curved|angular|wallpaper|wallpaper-round}/{YYYYMMDD-THHMMSSZ}/` (SVG + `index.html` の一覧ページ).

## Architecture

- **No dependencies, no build step** — plain ESM JavaScript, run directly with `node`
- `src/geometry.js` — ロゼッタの基本領域（正 n 角形の中心・辺の中点・頂点が作る直角三角形）と輪郭。曲線版の `levelCurve` と直線版の `levelPolyline` は同じ `{ start, end, segments }` を返し、segments に制御点があればベジェ、無ければ直線として書き出される
- `src/wallpaper-groups.js` — 17 群の定義。格子の種類と、格子座標での変換の生成元。変換の一覧は生成元からの閉包で作る
- `src/wallpaper-geometry.js` — 格子と基本領域（ディリクレ領域として計算）、凸多角形のユーティリティ、対称性の要素（回転中心・鏡・すべり鏡）の抽出
- `src/composition.js` — 帯の分割・配色・アクセント色といった、全ての版で共通の構図ルール
- `src/motif.js` / `src/motif-angular.js` / `src/motif-wallpaper.js` / `src/motif-wallpaper-round.js` — 基本領域 1 枚ぶんの模様の組み立て（ここだけが版ごとに違う）
- `src/render.js` — ロゼッタの SVG 組み立てと、全版で共通の一覧 HTML
- `src/render-wallpaper.js` — 壁紙群の SVG 組み立て（基本領域 → 群の変換 → 平行移動の 3 段構え）とガイドの描画。要素は `polygon`・`circle`・`path`（円弧やベジェを含む `d` をモチーフ側が組み立てる）の 3 種類
- `src/cli-shared.js` — 引数解釈・シード・出力先・後始末（全版で共通）
- `src/cli.js` / `src/cli-wallpaper.js` — 一括生成のループ（ロゼッタ用・壁紙群用）
- `src/generate*.js` — エントリポイント（`run()` に buildMotif を渡すだけ）
- `src/palettes.js` — 背景色と、色数 2〜6 の既定パレット
- `src/random.js` — seed 付き PRNG（mulberry32）

新しい版を足すときは `motif-*.js` と 10 行程度のエントリポイントを追加すれば足りる。

## Key invariants

- **ランダム性は必ず `createRandom(seed)` 経由で引く。** `Math.random()` を直接使うと seed による再現ができなくなる
- **曲線版は鏡映線上の端点で接線を鏡映線に直交させる。** これを崩すと 2n 個のコピーの継ぎ目に折れ目が出る（`levelCurve` の両端の接線）
- **基本領域からはみ出さないよう生成時に制約する。** クリップに頼るとコピー境界にアンチエイリアスの継ぎ目が出る
- **鏡映線に重なる幅ゼロの図形を作らない。** 塗りには現れないのに、継ぎ目埋めのヘアラインだけが線として模様の外に見えてしまう
- **背景は白固定で、パレットの色は背景に使わない。** パレットの色はすべて模様の側で使い切る
- **色はインデックスが小さいほど使用面積が大きい。** `colors[0]` が最も広い。壁紙群版は見えている面積を数えられるので、最後に面積順へ並べ替えて確定させる
- **seed に n を混ぜない。** n を範囲で生成したとき、同じ色数どうしで帯の構成と配色がそろわないと見比べられない
- **seed に壁紙群を混ぜない。** 同じ理由で、17 群は区画の構成と配色をそろえる
- **壁紙群版は「基本領域」の面積を群でそろえる**（単位格子ではなく）。こうするとモチーフが同じ大きさで現れ、並べ方の違いだけを見比べられる
- **壁紙群版のモチーフには必ず非対称な印を入れる。** 回転・鏡映・すべり鏡映を見分ける手がかりがなくなると、群を並べる意味が薄れる
- **壁紙群の変換は格子座標で定義する。** Cartesian で書くと 1/3 や √3 が入って誤差が出る。描画のときだけ `A = P·M·P⁻¹` で直す
- **丸み版で地の切れ目を曲げるときは、となり合う区画で同じ曲線を共有する。** 区画ごとに曲線を作り直すと、隙間か重なりが出て基本領域を覆えなくなる
- **丸み版の頂点・辺中点の扇形は、半径を領域内で 1 つに決める。** 頂点のまわりに集まるのが基本領域のどの頂点かは群によって違うので、頂点ごとに半径を変えると合わさった円の縁が欠ける
- **頂点の内角や辺の長さを使う前に `simplifyPolygon` で均す。** ディリクレ領域は半平面で切って作るので、長さが 1e-14 のような辺が残っている
