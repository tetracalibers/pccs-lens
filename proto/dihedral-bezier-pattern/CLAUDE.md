# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A prototype for generating SVG rosette patterns with dihedral group (D_n) symmetry from random Bézier curves. Part of the `pccs-lens` monorepo, located under `proto/`. This is not the main app — it's an isolated algorithm prototype. See `doc.md` for the full spec.

## Running

```bash
node src/generate.js            # 色数 2〜6 を一括生成
node src/generate.js --help     # オプション一覧
```

Output goes to `.generated/{YYYYMMDD-THHMMSSZ}/` (SVG + `index.html` の一覧ページ).

## Architecture

- **No dependencies, no build step** — plain ESM JavaScript, run directly with `node`
- `src/geometry.js` — 基本領域（正 n 角形の中心・辺の中点・頂点が作る直角三角形）と、その上のベジェ曲線
- `src/motif.js` — 基本領域 1 枚ぶんの模様の組み立て
- `src/generate.js` — SVG 文字列化・CLI・一括生成
- `src/palettes.js` — 色数 2〜6 の既定パレット
- `src/random.js` — seed 付き PRNG（mulberry32）

## Key invariants

- **ランダム性は必ず `createRandom(seed)` 経由で引く。** `Math.random()` を直接使うと seed による再現ができなくなる
- **鏡映線上の端点では接線を鏡映線に直交させる。** これを崩すと 2n 個のコピーの継ぎ目に折れ目が出る（`levelCurve` の両端の接線）
- **基本領域からはみ出さないよう生成時に制約する。** クリップに頼るとコピー境界にアンチエイリアスの継ぎ目が出る
- **背景は白固定で、パレットの色は背景に使わない。** パレットの色はすべて模様の側で使い切る
- **色はインデックスが小さいほど使用面積が大きい。** `colors[0]` が最も広い
