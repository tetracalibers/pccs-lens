<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { ankiMode } from "$lib/state/anki.svelte"

  // ── 寸法・レイアウト定数 ──
  const SIZE = 900 // SVG の一辺（px）
  const RADIUS = 240 // 各円の半径
  const H_SPREAD = 150 // Y・M 中心の横方向オフセット（中心 X ±）
  const V_GAP = 280 // C と Y・M の中心 Y 差
  const C_TOP_Y = 280 // C 円の中心 Y 座標

  // ── 色定数 ──
  const COLOR = {
    c: PCCS_HEX_MAP.get("v16"), // シアン
    y: PCCS_HEX_MAP.get("v8"), // 黄
    m: PCCS_HEX_MAP.get("v24"), // マゼンタ
    g: PCCS_HEX_MAP.get("v12"), // C∩Y（緑）
    b: PCCS_HEX_MAP.get("v19"), // C∩M（青）
    r: PCCS_HEX_MAP.get("v3"), // M∩Y（赤）
    black: "#1a1a1a", // C∩Y∩M（黒）
    label: "#ffffff"
  } as const

  const STROKE_COLORS = {
    c: "var(--canvas-pen-water)",
    y: "var(--canvas-pen-yellow)",
    m: "var(--canvas-pen-pink)",
    other: "var(--canvas-pen-gray)"
  } as const
  type StrokeColorKey = keyof typeof STROKE_COLORS

  // ── スタイル定数 ──
  const STROKE_WIDTH = 6
  const OUTER_FONT_SIZE = 68 // C・Y・M ラベルのフォントサイズ
  const INNER_FONT_SIZE = 50 // G・B・R ラベルのフォントサイズ
  const OUTER_LABEL_DIST = 60 // 円中心から外側ラベルまでの押し出し距離（px）
  const INNER_LABEL_DIST = 40 // 2 円中間点から交差ラベルまでの押し出し距離（px、正=重心から遠ざかる方向）

  // ── 型定義 ──
  type Pt = { x: number; y: number }

  // ── 円中心座標 ──
  const CENTER_X = SIZE / 2
  const pos: Record<"c" | "y" | "m", Pt> = {
    c: { x: CENTER_X, y: C_TOP_Y },
    y: { x: CENTER_X - H_SPREAD, y: C_TOP_Y + V_GAP },
    m: { x: CENTER_X + H_SPREAD, y: C_TOP_Y + V_GAP }
  }

  // ── 3 円の重心 ──
  const centroid: Pt = {
    x: (pos.c.x + pos.y.x + pos.m.x) / 3,
    y: (pos.c.y + pos.y.y + pos.m.y) / 3
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
    { id: "c", fill: COLOR.c, ...pos.c },
    { id: "y", fill: COLOR.y, ...pos.y },
    { id: "m", fill: COLOR.m, ...pos.m }
  ]

  // ── 外側ラベル（C・Y・M） ──
  const outerLabels = [
    { id: "c", text: "C", ...pushOut(pos.c, OUTER_LABEL_DIST) },
    { id: "y", text: "Y", ...pushOut(pos.y, OUTER_LABEL_DIST) },
    { id: "m", text: "M", ...pushOut(pos.m, OUTER_LABEL_DIST) }
  ]

  // ── 2 円交差領域（塗り用）
  //   pt:     描画する円の中心（クリップで交差を取り出す側）
  //   clipId: 適用するクリップパス ID
  //   lp:     交差ラベルの中心座標
  const intersections = [
    {
      id: "cy",
      pt: pos.y,
      clipId: "clipC",
      fill: COLOR.g,
      label: "G",
      lp: pushOut(midpoint(pos.c, pos.y), INNER_LABEL_DIST)
    },
    {
      id: "cm",
      pt: pos.m,
      clipId: "clipC",
      fill: COLOR.b,
      label: "B",
      lp: pushOut(midpoint(pos.c, pos.m), INNER_LABEL_DIST)
    },
    {
      id: "ym",
      pt: pos.m,
      clipId: "clipY",
      fill: COLOR.r,
      label: "R",
      lp: pushOut(midpoint(pos.y, pos.m), INNER_LABEL_DIST)
    }
  ]

  // ── 交差枠線（各交差につき両側の弧を描画） ──
  type CircleKey = "c" | "y" | "m"
  const circleKeys: CircleKey[] = ["c", "y", "m"]

  const intersectionStrokes = circleKeys.flatMap((a, i) =>
    circleKeys.slice(i + 1).flatMap((b) => [
      { id: `${a}${b}-${a}`, ...pos[a], clipId: `clip${b.toUpperCase()}` },
      { id: `${a}${b}-${b}`, ...pos[b], clipId: `clip${a.toUpperCase()}` }
    ])
  )

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width={SIZE} height={SIZE}>
  <defs>
    <!-- 各円の単独クリップパス（id: 'c'→'clipC' など） -->
    {#each baseCircles as c (c.id)}
      <clipPath id="clip{c.id.toUpperCase()}">
        <circle cx={c.x} cy={c.y} r={RADIUS} />
      </clipPath>
    {/each}

    <!-- C∩Y 交差クリップ（clipCYM 構築用の中間クリップ） -->
    <clipPath id="clipCY">
      <circle cx={pos.y.x} cy={pos.y.y} r={RADIUS} clip-path="url(#clipC)" />
    </clipPath>

    <!-- 3 円交差クリップ -->
    <clipPath id="clipCYM">
      <circle cx={pos.m.x} cy={pos.m.y} r={RADIUS} clip-path="url(#clipCY)" />
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

  <!-- 3 円交差領域（黒） -->
  <circle cx={pos.m.x} cy={pos.m.y} r={RADIUS} fill={COLOR.black} clip-path="url(#clipCYM)" />

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

  <!-- 外側ラベル（C・Y・M） -->
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
      {isAnki ? "" : lbl.text}
    </text>
  {/each}

  <!-- 交差ラベル（G・B・R） -->
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
      {isAnki ? "" : is.label}
    </text>
  {/each}
</svg>
