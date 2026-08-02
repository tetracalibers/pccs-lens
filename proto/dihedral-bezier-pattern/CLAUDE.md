# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A prototype for generating SVG rosette patterns with dihedral group (D_n) symmetry. Part of the `pccs-lens` monorepo, located under `proto/`. This is not the main app — it's an isolated algorithm prototype. See `doc.md` for the full spec.

輪郭の作り方が違う 2 つの版がある。構図・配色のルールは共通。

- **曲線版**（`src/generate.js` + `src/motif.js`）— 制御点がランダムな 3 次ベジェ曲線
- **直線版 / 角ばった版**（`src/generate-angular.js` + `src/motif-angular.js`）— 折れ線・多角形のみ

## Running

```bash
node src/generate.js            # 曲線版・色数 2〜6 を一括生成
node src/generate-angular.js    # 直線版・色数 2〜6 を一括生成
node src/generate.js --help     # オプション一覧（2 つのスクリプトで共通）
```

Output goes to `.generated/{curved|angular}/{YYYYMMDD-THHMMSSZ}/` (SVG + `index.html` の一覧ページ).

## Architecture

- **No dependencies, no build step** — plain ESM JavaScript, run directly with `node`
- `src/geometry.js` — 基本領域（正 n 角形の中心・辺の中点・頂点が作る直角三角形）と輪郭。曲線版の `levelCurve` と直線版の `levelPolyline` は同じ `{ start, end, segments }` を返し、segments に制御点があればベジェ、無ければ直線として書き出される
- `src/composition.js` — 帯の分割・配色・アクセント色といった、2 つの版で共通の構図ルール
- `src/motif.js` / `src/motif-angular.js` — 基本領域 1 枚ぶんの模様の組み立て（ここだけが版ごとに違う）
- `src/render.js` — 要素と `<use>` から SVG を組み立てる
- `src/cli.js` — 引数解釈と一括生成のループ
- `src/generate.js` / `src/generate-angular.js` — エントリポイント（`run()` に buildMotif を渡すだけ）
- `src/palettes.js` — 背景色と、色数 2〜6 の既定パレット
- `src/random.js` — seed 付き PRNG（mulberry32）

新しい版を足すときは `motif-*.js` と 10 行程度のエントリポイントを追加すれば足りる。

## Key invariants

- **ランダム性は必ず `createRandom(seed)` 経由で引く。** `Math.random()` を直接使うと seed による再現ができなくなる
- **曲線版は鏡映線上の端点で接線を鏡映線に直交させる。** これを崩すと 2n 個のコピーの継ぎ目に折れ目が出る（`levelCurve` の両端の接線）
- **基本領域からはみ出さないよう生成時に制約する。** クリップに頼るとコピー境界にアンチエイリアスの継ぎ目が出る
- **鏡映線に重なる幅ゼロの図形を作らない。** 塗りには現れないのに、継ぎ目埋めのヘアラインだけが線として模様の外に見えてしまう
- **背景は白固定で、パレットの色は背景に使わない。** パレットの色はすべて模様の側で使い切る
- **色はインデックスが小さいほど使用面積が大きい。** `colors[0]` が最も広い
