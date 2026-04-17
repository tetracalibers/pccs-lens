<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ── 寸法・レイアウト定数 ──
  const SIZE = 900 // SVG の一辺（px）
  const RADIUS = 240 // 各円の半径
  const H_SPREAD = 150 // G・B 中心の横方向オフセット（中心 X ±）
  const V_GAP = 280 // R と G・B の中心 Y 差
  const R_TOP_Y = 280 // R 円の中心 Y 座標

  // ── 色定数 ──
  const COLOR = {
    r: PCCS_HEX_MAP.get("v3"), // 赤
    g: PCCS_HEX_MAP.get("v12"), // 緑
    b: PCCS_HEX_MAP.get("v19"), // 青
    y: PCCS_HEX_MAP.get("v8"), // R∩G（黄）
    m: PCCS_HEX_MAP.get("v24"), // R∩B（マゼンタ）
    c: PCCS_HEX_MAP.get("v16"), // G∩B（シアン）
    white: "#fff", // R∩G∩B（白）
    label: "#ffffff"
  } as const

  const STROKE_COLORS = {
    r: "var(--canvas-pen-red)",
    g: "var(--canvas-pen-green)",
    b: "var(--canvas-pen-blue)",
    other: "var(--canvas-pen-gray)"
  } as const
  type StrokeColorKey = keyof typeof STROKE_COLORS

  // ── スタイル定数 ──
  const STROKE_WIDTH = 6
  const OUTER_FONT_SIZE = 68 // R・G・B ラベルのフォントサイズ
  const INNER_FONT_SIZE = 50 // Y・M・C ラベルのフォントサイズ
  const OUTER_LABEL_DIST = 60 // 円中心から外側ラベルまでの押し出し距離（px）
  const INNER_LABEL_DIST = 40 // 2 円中間点から交差ラベルまでの押し出し距離（px、正=重心から遠ざかる方向）

  // ── 型定義 ──
  type Pt = { x: number; y: number }

  // ── 円中心座標 ──
  const CENTER_X = SIZE / 2
  const pos: Record<"r" | "g" | "b", Pt> = {
    r: { x: CENTER_X, y: R_TOP_Y },
    g: { x: CENTER_X - H_SPREAD, y: R_TOP_Y + V_GAP },
    b: { x: CENTER_X + H_SPREAD, y: R_TOP_Y + V_GAP }
  }

  // ── 3 円の重心 ──
  const centroid: Pt = {
    x: (pos.r.x + pos.g.x + pos.b.x) / 3,
    y: (pos.r.y + pos.g.y + pos.b.y) / 3
  }

  /** 点 p を重心から遠ざかる方向へ dist px 移動した座標を返す */
  function pushOut(p: Pt, dist: number): Pt {
    const dx = p.x - centroid.x
    const dy = p.y - centroid.y
    const len = Math.hypot(dx, dy)
    return { x: p.x + (dx / len) * dist, y: p.y + (dy / len) * dist }
  }

  /** 2 点の中点を返す */
  function midpoint(a: Pt, b: Pt): Pt {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  // ── 基本円（id は clipPath ID 生成にも使用） ──
  const baseCircles = [
    { id: "r", fill: COLOR.r, ...pos.r },
    { id: "g", fill: COLOR.g, ...pos.g },
    { id: "b", fill: COLOR.b, ...pos.b }
  ]

  // ── 外側ラベル（R・G・B） ──
  const outerLabels = [
    { id: "r", text: "R", ...pushOut(pos.r, OUTER_LABEL_DIST) },
    { id: "g", text: "G", ...pushOut(pos.g, OUTER_LABEL_DIST) },
    { id: "b", text: "B", ...pushOut(pos.b, OUTER_LABEL_DIST) }
  ]

  // ── 2 円交差領域（塗り用）
  //   pt:     描画する円の中心（クリップで交差を取り出す側）
  //   clipId: 適用するクリップパス ID
  //   lp:     交差ラベルの中心座標（2 円の中間点）
  const intersections = [
    {
      id: "rg",
      pt: pos.g,
      clipId: "clipR",
      fill: COLOR.y,
      label: "Y",
      lp: pushOut(midpoint(pos.r, pos.g), INNER_LABEL_DIST)
    },
    {
      id: "rb",
      pt: pos.b,
      clipId: "clipR",
      fill: COLOR.m,
      label: "M",
      lp: pushOut(midpoint(pos.r, pos.b), INNER_LABEL_DIST)
    },
    {
      id: "gb",
      pt: pos.b,
      clipId: "clipG",
      fill: COLOR.c,
      label: "C",
      lp: pushOut(midpoint(pos.g, pos.b), INNER_LABEL_DIST)
    }
  ]

  // ── 交差枠線（各交差につき両側の弧を描画） ──
  type CircleKey = "r" | "g" | "b"
  const circleKeys: CircleKey[] = ["r", "g", "b"]

  const intersectionStrokes = circleKeys.flatMap((a, i) =>
    circleKeys.slice(i + 1).flatMap((b) => [
      { id: `${a}${b}-${a}`, ...pos[a], clipId: `clip${b.toUpperCase()}` },
      { id: `${a}${b}-${b}`, ...pos[b], clipId: `clip${a.toUpperCase()}` }
    ])
  )
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width={SIZE} height={SIZE}>
  <defs>
    <!-- 各円の単独クリップパス（id: 'r'→'clipR' など） -->
    {#each baseCircles as c (c.id)}
      <clipPath id="clip{c.id.toUpperCase()}">
        <circle cx={c.x} cy={c.y} r={RADIUS} />
      </clipPath>
    {/each}

    <!-- R∩G 交差クリップ（clipRGB 構築用の中間クリップ） -->
    <clipPath id="clipRG">
      <circle cx={pos.g.x} cy={pos.g.y} r={RADIUS} clip-path="url(#clipR)" />
    </clipPath>

    <!-- 3 円交差クリップ -->
    <clipPath id="clipRGB">
      <circle cx={pos.b.x} cy={pos.b.y} r={RADIUS} clip-path="url(#clipRG)" />
    </clipPath>
  </defs>

  <!-- ── 塗り面（下層）── -->

  <!-- 基本 3 円（塗りのみ） -->
  {#each baseCircles as c (c.id)}
    <circle cx={c.x} cy={c.y} r={RADIUS} fill={c.fill} />
  {/each}

  <!-- 2 円交差領域（塗りのみ） -->
  {#each intersections as is (is.id)}
    <circle cx={is.pt.x} cy={is.pt.y} r={RADIUS} fill={is.fill} clip-path="url(#{is.clipId})" />
  {/each}

  <!-- 3 円交差領域（塗りのみ） -->
  <circle cx={pos.b.x} cy={pos.b.y} r={RADIUS} fill={COLOR.white} clip-path="url(#clipRGB)" />

  <!-- ── 枠線（上層）── -->

  <!-- 基本 3 円の外周（色付き） -->
  {#each baseCircles as c (`${c.id}-stroke`)}
    <circle
      cx={c.x}
      cy={c.y}
      r={RADIUS}
      fill="none"
      stroke={STROKE_COLORS[c.id as StrokeColorKey]}
      stroke-width={STROKE_WIDTH}
    />
  {/each}

  <!-- 交差領域の枠線（灰色、各交差の両側の弧を描画） -->
  {#each intersectionStrokes as s (s.id)}
    <circle
      cx={s.x}
      cy={s.y}
      r={RADIUS}
      fill="none"
      stroke={STROKE_COLORS.other}
      stroke-width={STROKE_WIDTH}
      clip-path="url(#{s.clipId})"
    />
  {/each}

  <!-- 外側ラベル（R・G・B） -->
  {#each outerLabels as lbl (lbl.id)}
    <text
      x={lbl.x}
      y={lbl.y}
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="var(--font-classic)"
      font-size={OUTER_FONT_SIZE}
      font-weight="bold"
      fill={COLOR.label}
    >
      {lbl.text}
    </text>
  {/each}

  <!-- 交差ラベル（Y・M・C） -->
  {#each intersections as is (`${is.id}-lbl`)}
    <text
      x={is.lp.x}
      y={is.lp.y}
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="var(--font-classic)"
      font-size={INNER_FONT_SIZE}
      font-weight="bold"
      fill={COLOR.label}
    >
      {is.label}
    </text>
  {/each}
</svg>
