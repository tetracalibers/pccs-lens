<script lang="ts">
  import chroma from "chroma-js"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== SVG dimensions =====
  const PAD = 10
  const SQ = 200
  const ARROW_REGION = 200
  const WIDTH = PAD * 2 + SQ * 2 + ARROW_REGION
  const HEIGHT = PAD * 2 + SQ

  // ===== 矢印 =====
  const ARROW_MARGIN = 18
  const ARROW_STROKE_WIDTH = 2
  const GAP_TEXT_TO_LINE = 14
  const FONT_SIZE_LABEL = 16

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 20
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 市松模様 =====
  const CHECKER_DIVISIONS = 30
  const CHECKER_CELL = SQ / CHECKER_DIVISIONS

  // ===== 色 =====
  const COL_A = PCCS_HEX_MAP.get("b8")!
  const COL_B = PCCS_HEX_MAP.get("lt12")!
  const COL_MIXED = chroma.average([COL_A, COL_B], "lrgb").hex()
  const COL_TEXT = "var(--color-body)"
  const COL_ARROW = "var(--color-body)"

  // ===== 座標 =====
  const LEFT_X = PAD
  const RIGHT_X = WIDTH - PAD - SQ
  const SQ_Y = (HEIGHT - SQ) / 2
  const ARROW_Y = HEIGHT / 2
  const ARROW_X1 = LEFT_X + SQ + ARROW_MARGIN
  const ARROW_X2 = RIGHT_X - ARROW_MARGIN
  const TEXT_X = (ARROW_X1 + ARROW_X2) / 2
  const TEXT_Y = ARROW_Y - GAP_TEXT_TO_LINE
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <pattern
      id="pm-checker"
      x={LEFT_X}
      y={SQ_Y}
      width={CHECKER_CELL * 2}
      height={CHECKER_CELL * 2}
      patternUnits="userSpaceOnUse"
    >
      <rect x="0" y="0" width={CHECKER_CELL} height={CHECKER_CELL} fill={COL_A} />
      <rect
        x={CHECKER_CELL}
        y={CHECKER_CELL}
        width={CHECKER_CELL}
        height={CHECKER_CELL}
        fill={COL_A}
      />
      <rect x={CHECKER_CELL} y="0" width={CHECKER_CELL} height={CHECKER_CELL} fill={COL_B} />
      <rect x="0" y={CHECKER_CELL} width={CHECKER_CELL} height={CHECKER_CELL} fill={COL_B} />
    </pattern>

    <marker
      id="pm-arrow"
      viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
      refX={ARROW_HEAD_VIEWBOX / 2}
      refY={ARROW_HEAD_VIEWBOX / 2}
      markerWidth={ARROW_HEAD_SIZE}
      markerHeight={ARROW_HEAD_SIZE}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <polyline
        points="0,3.5 3.5,1.75 0,0"
        fill="none"
        stroke={COL_ARROW}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 混色前: PCCS有彩色2色の市松模様 -->
  <rect x={LEFT_X} y={SQ_Y} width={SQ} height={SQ} fill="url(#pm-checker)" />

  <!-- 混色後: lrgb空間で平均した色 -->
  <rect x={RIGHT_X} y={SQ_Y} width={SQ} height={SQ} fill={COL_MIXED} />

  <!-- ラベル「点を細かくする」 -->
  <text
    x={TEXT_X}
    y={TEXT_Y}
    text-anchor="middle"
    fill={COL_TEXT}
    font-size={FONT_SIZE_LABEL}
    font-weight="bold"
  >
    点を細かくする
  </text>

  <!-- 矢印 -->
  <line
    x1={ARROW_X1}
    y1={ARROW_Y}
    x2={ARROW_X2}
    y2={ARROW_Y}
    stroke={COL_ARROW}
    stroke-width={ARROW_STROKE_WIDTH}
    stroke-linecap="round"
    marker-end="url(#pm-arrow)"
  />
</svg>
