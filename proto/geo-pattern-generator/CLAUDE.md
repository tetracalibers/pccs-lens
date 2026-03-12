# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A prototype for generating random geometric SVG patterns (Bauhaus and Geometric styles). Part of the `pccs-lens` monorepo, located under `proto/`. This is not the main app — it's an isolated algorithm prototype.

## Running Patterns

Each pattern is implemented as a standalone `.ts` file, executed directly with `tsx`:

```bash
tsx src/bauhaus.ts            # バウハウスパターン
tsx src/geometric.ts          # 直角三角形タイリング
tsx src/geometric-shade.ts    # 濃淡付き三角形タイリング（ローポリ 3D）
tsx src/geometric-blend.ts    # ランダム散布 + ブレンド
```

色は引数で渡せる（省略時はデフォルト色）:

```bash
tsx src/bauhaus.ts '#F5F0E8' '#1B3A4B' '#D4875A'
```

Output SVGs are written to `.generated/{patternName}/{YYYYMMDD-THHMMSSZ}.svg`.

## Architecture

- **One `.ts` file per pattern type** — each file exports a generator function accepting 3 HEX color codes
- **Color priority rule**: lower index = larger usage area (color[0] most dominant, color[2] least)
- **Canvas size**: ~300×300px square SVG
- **SVG construction**: uses `@svgdotjs/svg.js`
- **No build step** — `tsx` runs TypeScript directly at runtime

## Pattern Specifications

### Bauhaus Pattern

Grid-based layout with geometric shapes (circle, rectangle, arch, line) placed randomly per cell.

Constraints:
- Rotation: 0°/90°/180°/270° only
- 1 color per cell, fixed background
- Max 1–2 shapes per cell
- Occasionally merge 2×2 cells for a larger shape

### Geometric Pattern

Triangle-based with variants:
- Same shape/size triangles tiled with random rotation
- Triangles of varying shade and shape tiled together
- Randomly placed triangles with color blending at overlaps
