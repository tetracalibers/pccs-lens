# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A prototype for generating SVG patterns with mirror symmetry — dihedral (D_n) rosettes, all 17 wallpaper groups side by side, and the aperiodic Penrose tilings (P1 and P2). Part of the `pccs-lens` monorepo, located under `proto/`. This is not the main app — it's an isolated algorithm prototype. See `doc.md` for the full spec.

対称性と描き方が違う 7 つの版がある。構図・配色のルールは共通。

- **曲線版**（`src/generate.js` + `src/motif.js`）— 制御点がランダムな 3 次ベジェ曲線のロゼッタ
- **直線版 / 角ばった版**（`src/generate-angular.js` + `src/motif-angular.js`）— 折れ線・多角形のみのロゼッタ
- **壁紙群版**（`src/generate-wallpaper.js` + `src/motif-wallpaper.js`）— 平面を埋めつくす繰り返し模様。**直線的で美しい幾何模様そのもの**を作るのが目的（対称操作の見分けに使う非対称な印は `--mark` のときだけ置く）
- **壁紙群・丸み版**（`src/generate-wallpaper-round.js` + `src/motif-wallpaper-round.js`）— 丸い図形の組み合わせで描く版。**17 の壁紙群を同じモチーフで見比べる**のが目的なので、非対称な印を既定で置く
- **ペンローズ版**（`src/generate-penrose.js` + `src/motif-penrose.js`）— 五角形ペンローズタイリング（P1: 正五角形・星・舟・菱形）。**この版とカイト＆ダート版だけ基本領域を持たない。** 平行移動の周期がないので、群の変換でコピーせず、タイルを 1/φ² に縮めて置き換える置換規則で埋める
- **カイト＆ダート版**（`src/generate-kite-dart.js` + `src/motif-kite-dart.js`）— カイト＆ダートタイリング（ペンローズ P2: 凧形と矢じり形の 2 種）。タイルを半分に切った二等辺三角形を 1/φ に縮んだ三角形へ切り分ける分割規則で埋める。P1 と違って**子は必ず親の内側**に生まれる
- **準結晶版**（`src/generate-crystal.js` + `src/motif-crystal.js`）— カイト＆ダート版と**同じタイリングを結晶標本として描く**版。タイルの塗り分けだけでなく、結晶面（向きから作った法線＋斜めからの光）・劈開線・頂点ネットワーク・回折像・粒界を層として重ねる。結晶核を画面の中心に置くので、中心のまわりだけが正確な D5 対称になる

## Running

```bash
node src/generate.js                 # 曲線版・色数 2〜6 を一括生成
node src/generate-angular.js         # 直線版・色数 2〜6 を一括生成
node src/generate-wallpaper.js       # 壁紙群版・17 群 × 色数 2〜6 を一括生成
node src/generate-wallpaper-round.js # 壁紙群・丸み版（オプションは壁紙群版と共通）
node src/generate-penrose.js         # ペンローズ版・色数 2〜6 を一括生成
node src/generate-kite-dart.js       # カイト＆ダート版・色数 2〜6 を一括生成
node src/generate-crystal.js         # 準結晶版・色数 2〜6 を一括生成
node src/generate.js --n=4,24        # n = 4〜24 も範囲で一括生成（1 ディレクトリ・1 HTML）
node src/generate.js --color-count=4,5  # 生成する色数を絞る（7 つのスクリプトで共通）
node src/generate-angular.js --exclude=spoke,dot  # 描かない要素を指定する（ロゼッタ版のみ）
node src/generate-wallpaper.js --guide  # 対称性の要素（格子・基本領域・回転中心・鏡）を重ねる
node src/generate-wallpaper.js --mark   # 非対称な印を置く（丸み版は既定であり、--no-mark で外す）
node src/generate-penrose.js --repeat=16 --outline  # タイルを細かくし、輪郭を描く（カイト＆ダート版も同じ）
node src/generate-crystal.js --layers=cleave,network  # 面を描かず、結晶格子だけを残す
node src/generate-crystal.js --color-by=zone --frames=8  # 成長痕の色分けで、析出のコマ送り
node src/generate-crystal.js --seeds=4  # 多結晶（粒界が出る）
node src/generate.js --help          # オプション一覧（--help は 7 つのスクリプトで共通）
```

Output goes to `.generated/{curved|angular|wallpaper|wallpaper-round|penrose|kite-dart|crystal}/{YYYYMMDD-THHMMSSZ}/` (SVG + `index.html` の一覧ページ).

## Architecture

- **No dependencies, no build step** — plain ESM JavaScript, run directly with `node`
- `src/geometry.js` — ロゼッタの基本領域（正 n 角形の中心・辺の中点・頂点が作る直角三角形）と輪郭。曲線版の `levelCurve` と直線版の `levelPolyline` は同じ `{ start, end, segments }` を返し、segments に制御点があればベジェ、無ければ直線として書き出される
- `src/wallpaper-groups.js` — 17 群の定義。格子の種類と、格子座標での変換の生成元。変換の一覧は生成元からの閉包で作る
- `src/wallpaper-geometry.js` — 格子と基本領域（ディリクレ領域として計算）、凸多角形のユーティリティ、対称性の要素（回転中心・鏡・すべり鏡）の抽出
- `src/composition.js` — 帯の分割・配色・アクセント色といった、全ての版で共通の構図ルール
- `src/motif.js` / `src/motif-angular.js` / `src/motif-wallpaper.js` / `src/motif-wallpaper-round.js` — 基本領域 1 枚ぶんの模様の組み立て（ここだけが版ごとに違う）
- `src/render.js` — ロゼッタの SVG 組み立てと、全版で共通の一覧 HTML
- `src/render-wallpaper.js` — 壁紙群の SVG 組み立て（基本領域 → 群の変換 → 平行移動の 3 段構え）とガイドの描画。要素は `polygon`・`circle`・`path`（円弧やベジェを含む `d` をモチーフ側が組み立てる）の 3 種類
- `src/penrose-geometry.js` — ペンローズ P1 の 4 種のタイルの形と置換規則。向きは 36 度を 1 とする整数で持つ
- `src/kite-dart-geometry.js` — ペンローズ P2 のタイルの形と分割規則。半タイル（ロビンソン三角形）で分割し、最後に軸の辺で 2 枚ずつ突き合わせてカイト・ダートに戻す
- `src/render-penrose.js` — ペンローズ版とカイト＆ダート版で共通の SVG 組み立て（繰り返しがないので `<use>` は使えず、タイルを 1 枚ずつ書き出す）
- `src/crystal-geometry.js` — 準結晶版の幾何。タイルの向き（36 度刻みの整数）・頂点ネットワーク・劈開線（頂点が乗る平行線族とその φ 倍への粗くし方）・結晶面の法線・成長・多結晶（ボロノイ領域と多角形の切り取り）
- `src/crystal-diffraction.js` — 頂点の点群の構造因子 S(k) を数え、ピークを拾う
- `src/render-crystal.js` — 準結晶版の SVG 組み立て。線が数千本になるので、同じ描き方の線は 1 本の `<path>` にまとめる
- `src/color-utils.js` — 16 進の色を明るくする・暗くする・混ぜる。ファセットの陰影と、線に使うインク（パレットでいちばん暗い色から作る）
- `src/cli-shared.js` — 引数解釈・シード・出力先・後始末（全版で共通）
- `src/cli.js` / `src/cli-wallpaper.js` / `src/cli-penrose.js` / `src/cli-kite-dart.js` / `src/cli-crystal.js` — 一括生成のループ（ロゼッタ用・壁紙群用・ペンローズ用・カイト＆ダート用・準結晶用）
- `src/generate*.js` — エントリポイント（`run()` に buildMotif を渡すだけ。ペンローズ版・カイト＆ダート版・準結晶版は渡すものがないので `run()` だけ）
- `src/palettes.js` — 背景色と、色数 2〜6 の既定パレット
- `src/random.js` — seed 付き PRNG（mulberry32）

新しい版を足すときは `motif-*.js` と 10 行程度のエントリポイントを追加すれば足りる（準結晶版のように描き方そのものが違うときは、幾何とレンダラも版ごとに足す）。

## Key invariants

- **ランダム性は必ず `createRandom(seed)` 経由で引く。** `Math.random()` を直接使うと seed による再現ができなくなる
- **`--exclude` で外した要素も組み立てまでは行う**（`motif*.js` の `push` ヘルパー）。作らずに飛ばすと rng の消費列がずれ、同じ seed でも別の模様になってしまう。要素を足すときは `elements.push` ではなく `push(role, ...)` を使い、`ROLES` にも名前を足す
- **曲線版は鏡映線上の端点で接線を鏡映線に直交させる。** これを崩すと 2n 個のコピーの継ぎ目に折れ目が出る（`levelCurve` の両端の接線）
- **基本領域からはみ出さないよう生成時に制約する。** クリップに頼るとコピー境界にアンチエイリアスの継ぎ目が出る
- **鏡映線に重なる幅ゼロの図形を作らない。** 塗りには現れないのに、継ぎ目埋めのヘアラインだけが線として模様の外に見えてしまう
- **背景は白固定で、パレットの色は背景に使わない。** パレットの色はすべて模様の側で使い切る
- **色はインデックスが小さいほど使用面積が大きい。** `colors[0]` が最も広い。壁紙群版は見えている面積を数えられるので、最後に面積順へ並べ替えて確定させる
- **seed に n を混ぜない。** n を範囲で生成したとき、同じ色数どうしで帯の構成と配色がそろわないと見比べられない
- **seed に壁紙群を混ぜない。** 同じ理由で、17 群は区画の構成と配色をそろえる
- **壁紙群版は「基本領域」の面積を群でそろえる**（単位格子ではなく）。こうするとモチーフが同じ大きさで現れ、並べ方の違いだけを見比べられる
- **非対称な印を置くなら必ず非対称な形にする**（`--mark` / `--no-mark`）。回転・鏡映・すべり鏡映を見分ける手がかりになるのは印の非対称性だけ。既定は版の目的で分かれる：直線版（`generate-wallpaper.js`）は幾何模様そのものを作るのが目的なので印なし、丸み版は群の見比べが目的なので印あり
- **壁紙群の変換は格子座標で定義する。** Cartesian で書くと 1/3 や √3 が入って誤差が出る。描画のときだけ `A = P·M·P⁻¹` で直す
- **丸み版で地の切れ目を曲げるときは、となり合う区画で同じ曲線を共有する。** 区画ごとに曲線を作り直すと、隙間か重なりが出て基本領域を覆えなくなる
- **丸み版の頂点・辺中点の扇形は、半径を領域内で 1 つに決める。** 頂点のまわりに集まるのが基本領域のどの頂点かは群によって違うので、頂点ごとに半径を変えると合わさった円の縁が欠ける
- **頂点の内角や辺の長さを使う前に `simplifyPolygon` で均す。** ディリクレ領域は半平面で切って作るので、長さが 1e-14 のような辺が残っている
- **ペンローズ版の置換で生まれるタイルは親からはみ出す。** はみ出した先は隣のタイルが同じタイルを生むので、位置と向きで重複をまとめて 1 枚にする。まとめないと重なりだらけになる
- **ペンローズ版の菱形には向き（矢印）がある。** 置換すると五角形が長い対角線の片側に寄るため。菱形の両側の五角形は必ず向きが違うので、「決めたほうの向きの五角形から外を向く」で矢印が一意に決まる（`inwardParity`。0 と 1 は鏡像の関係で、どちらでも正しく敷き詰まる）
- **ペンローズ版の五角形は 5 辺すべてに菱形を出すが、辺の向こうが星や舟のときは落とす。** その隙間は星や舟が埋めるので、落とさないと重なる
- **ペンローズ版の敷き詰めは点をサンプルして検算する。** 各点を覆うタイルがちょうど 1 枚かを数えれば、規則の取り違えが隙間か重なりとして必ず出る
- **ペンローズ版の seed は模様ではなく切り取り方を決める。** タイリング自体は置換規則で一意に決まる。seed に色数を混ぜないので、色数を変えても同じ場所が出る（カイト＆ダート版も同じ）
- **カイト＆ダート版は半タイル（ロビンソン三角形）で分割する。** カイト・ダートのままでは分割規則が書けない。半カイト → 半カイト 2 + 半ダート 1、半ダート → 半カイト 1 + 半ダート 1
- **半タイルの頂点は `[p0, p1, p2]` の並びで役割を持つ。** どちらの型でも `p2–p0` が軸（切った線）で、`p0–p1` と `p1–p2` がタイルの辺。この区別を崩すと、分割の向きも突き合わせもできなくなる
- **ダートは 2 つの親にまたがってできる。** 半ダートは必ず親の長辺をまたいで生まれるので、親が 1 枚に定まるのはカイトだけ。色分けでダートを分けるときは「両側の親の種類の組」で分ける
- **カイト＆ダート版の枝刈りはタイル 2 枚ぶんの余裕を残す。** 相方の半タイルまで捨てるとタイルを突き合わせられず、画面内に半分だけの図形が出る
- **準結晶版の劈開線はタイルに描かず、タイリングから取り出す。** Ammann bar をタイルの装飾として自前で決めると、隣のタイルと線がつながるかを検算できない。頂点を法線方向へ射影して数えれば、頂点が乗る平行線族が誤差なく求まる（間隔が φ : 1 の 2 種類になることまで数値で確かめられる）
- **準結晶版の劈開線を粗くするときは、フィボナッチ列の逆変換で間引く。** 「短いほうの間隔を始める線を落とす」と間隔が φ 倍に伸びた同じ形の列になる。割合で間引くと並びが崩れ、タイリングとの対応が切れる
- **準結晶版の回折像はいちばん上に重ねる。** 背面に置くとタイルの面に隠れて 1 つも見えない。ピークは半径 kMax の円の中だけ・同じ |k| のリングごとに採る（四隅まで採ったり強さの順に N 個で切ったりすると、リングが欠けて 10 回対称が崩れる）
- **多結晶は粒の境界でタイルを切る。** 重心でどちらの粒かを決めて捨てると、境目に隙間が空く（となりの粒は別のタイリングなので埋められない）。ただし向きや親子は切る前の形から取る（切った形からは軸が求まらないので、`points` と描画用の `draw` を分けて持つ）
