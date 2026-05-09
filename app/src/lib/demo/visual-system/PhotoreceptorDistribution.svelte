<script lang="ts">
  import { line, curveMonotoneX } from "d3-shape"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface DistributionPoint {
    angle: number
    value: number
  }

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 110
  const PLOT_TOP = 80
  const MARGIN_RIGHT = 30
  const MARGIN_BOTTOM = 170
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 軸の範囲 =====
  const ANGLE_MIN = -80
  const ANGLE_MAX = 80
  const VALUE_MIN = 0
  const VALUE_MAX = 18

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 20
  const Y_TICK_INTERVAL = 2
  const X_LABELED_TICKS = [-80, -60, -40, -20, 0, 20, 40, 60, 80]
  const Y_LABELED_TICKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 30
  const FONT_SIZE_Y_AXIS_LABEL = 22
  const FONT_SIZE_FEATURE_LABEL = 26
  const FONT_SIZE_LEGEND = 24

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 145 // PLOT_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 80 // PLOT_LEFT から軸ラベル中心まで

  // ===== 注釈用矢印・ラベル位置（X軸下部） =====
  const X_ANNO_ARROW_TIP_Y = PLOT_BOTTOM + 52
  const X_ANNO_ARROW_TAIL_Y = PLOT_BOTTOM + 92
  const X_ANNO_LABEL_Y = PLOT_BOTTOM + 118

  // ===== 注釈用矢印・ラベル位置（プロット上部） =====
  const TOP_ANNO_LABEL_Y = 28
  const TOP_ANNO_ARROW_TAIL_Y = 44
  const TOP_ANNO_ARROW_TIP_Y = PLOT_TOP - 6

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_CURVE = 3
  const STROKE_WIDTH_ARROW = 2.5

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_ARROW = "var(--color-body)"
  const COL_CONE = "#dc2626" // 錐体（赤）
  const COL_ROD = "#2563eb" // 桿体（青）

  // ===== 矢の形状 =====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 18
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_ARROW * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 特徴点の角度 =====
  const FOVEA_ANGLE = 0
  const BLIND_SPOT_ANGLE = 15

  // ===== 凡例の位置（プロット内右上） =====
  const LEGEND_LINE_LENGTH = 56
  const LEGEND_ROW_GAP = 32
  const LEGEND_LABEL_GAP = 14
  const LEGEND_LINE_X1 = PLOT_RIGHT - 150
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_Y_CONE = PLOT_TOP + 28
  const LEGEND_Y_ROD = LEGEND_Y_CONE + LEGEND_ROW_GAP

  // ===== 分布データ =====
  // 中心窩(0°)で錐体ピーク・桿体0、視神経乳頭(+15°)で両者0
  const cones: DistributionPoint[] = [
    { angle: -80, value: 0.3 },
    { angle: -60, value: 0.5 },
    { angle: -40, value: 0.7 },
    { angle: -30, value: 0.9 },
    { angle: -20, value: 1.2 },
    { angle: -10, value: 2.5 },
    { angle: -5, value: 7 },
    { angle: -2, value: 13 },
    { angle: 0, value: 17 },
    { angle: 2, value: 13 },
    { angle: 5, value: 7 },
    { angle: 10, value: 2.5 },
    { angle: 13, value: 1.5 },
    { angle: 14, value: 0.6 },
    { angle: 15, value: 0 },
    { angle: 16, value: 0.6 },
    { angle: 17, value: 1.5 },
    { angle: 20, value: 1.2 },
    { angle: 30, value: 0.9 },
    { angle: 40, value: 0.7 },
    { angle: 60, value: 0.5 },
    { angle: 80, value: 0.3 }
  ]

  const rods: DistributionPoint[] = [
    { angle: -80, value: 4 },
    { angle: -60, value: 7 },
    { angle: -50, value: 10 },
    { angle: -40, value: 13 },
    { angle: -30, value: 15 },
    { angle: -20, value: 16 },
    { angle: -17, value: 16.2 },
    { angle: -10, value: 13 },
    { angle: -5, value: 6 },
    { angle: -2, value: 1.5 },
    { angle: 0, value: 0 },
    { angle: 2, value: 1.5 },
    { angle: 5, value: 6 },
    { angle: 10, value: 13 },
    { angle: 13, value: 14 },
    { angle: 14, value: 7 },
    { angle: 15, value: 0 },
    { angle: 16, value: 7 },
    { angle: 17, value: 14 },
    { angle: 20, value: 16 },
    { angle: 30, value: 15 },
    { angle: 40, value: 13 },
    { angle: 50, value: 10 },
    { angle: 60, value: 7 },
    { angle: 80, value: 4 }
  ]

  // ===== 座標変換 =====
  const xAt = (angle: number): number =>
    PLOT_LEFT + ((angle - ANGLE_MIN) / (ANGLE_MAX - ANGLE_MIN)) * PLOT_WIDTH
  const yAt = (value: number): number =>
    PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * PLOT_HEIGHT

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.floor((ANGLE_MAX - ANGLE_MIN) / X_TICK_INTERVAL) + 1 },
    (_, i) => ANGLE_MIN + i * X_TICK_INTERVAL
  )
  const yTicks = Array.from(
    { length: Math.floor((VALUE_MAX - VALUE_MIN) / Y_TICK_INTERVAL) + 1 },
    (_, i) => VALUE_MIN + i * Y_TICK_INTERVAL
  )

  // ===== 滑らかなパス生成（curveMonotoneX で 0 への急降下を素直に表現） =====
  const lineGen = line<DistributionPoint>()
    .x((d) => xAt(d.angle))
    .y((d) => yAt(d.value))
    .curve(curveMonotoneX)

  const conesPath = lineGen(cones) ?? ""
  const rodsPath = lineGen(rods) ?? ""

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <marker
      id="photoreceptor-arrow"
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
    <clipPath id="photoreceptor-plot-clip">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
  </defs>

  <!-- 横軸 -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_BOTTOM}
    x2={PLOT_RIGHT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 縦軸 -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_TOP}
    x2={PLOT_LEFT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 横軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each xTicks as angle (angle)}
      <line x1={xAt(angle)} y1={PLOT_BOTTOM} x2={xAt(angle)} y2={PLOT_BOTTOM + TICK_LENGTH} />
    {/each}
  </g>

  <!-- 縦軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each yTicks as v (v)}
      <line x1={PLOT_LEFT} y1={yAt(v)} x2={PLOT_LEFT - TICK_LENGTH} y2={yAt(v)} />
    {/each}
  </g>

  <!-- 横軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="middle">
    {#each X_LABELED_TICKS as angle (angle)}
      <text x={xAt(angle)} y={PLOT_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {angle}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「中心窩からの角度 (°)」 -->
  <text
    x={(PLOT_LEFT + PLOT_RIGHT) / 2}
    y={PLOT_BOTTOM + X_AXIS_LABEL_OFFSET}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
  >
    中心窩からの角度 (°)
  </text>

  <!-- 縦軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="end">
    {#each Y_LABELED_TICKS as v (v)}
      <text x={PLOT_LEFT - Y_TICK_LABEL_OFFSET} y={yAt(v)} dominant-baseline="central">
        {v}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「1mm² あたりの錐体・桿体の数 (万個)」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_Y_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    1mm² あたりの錐体・桿体の数 (万個)
  </text>

  <!-- 桿体の曲線（青） -->
  <path
    d={rodsPath}
    fill="none"
    stroke={COL_ROD}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#photoreceptor-plot-clip)"
  />

  <!-- 錐体の曲線（赤） -->
  <path
    d={conesPath}
    fill="none"
    stroke={COL_CONE}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#photoreceptor-plot-clip)"
  />

  <!-- 中心窩（X軸下、上向き矢印 + ラベル） -->
  <line
    x1={xAt(FOVEA_ANGLE)}
    y1={X_ANNO_ARROW_TAIL_Y}
    x2={xAt(FOVEA_ANGLE)}
    y2={X_ANNO_ARROW_TIP_Y}
    stroke={COL_ARROW}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#photoreceptor-arrow)"
  />
  {#if !isAnki}
    <text
      x={xAt(FOVEA_ANGLE)}
      y={X_ANNO_LABEL_Y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_FEATURE_LABEL}
      fill={COL_LABEL}
    >
      中心窩
    </text>
  {/if}

  <!-- 視神経乳頭（X軸下、上向き矢印 + ラベル） -->
  <line
    x1={xAt(BLIND_SPOT_ANGLE)}
    y1={X_ANNO_ARROW_TAIL_Y}
    x2={xAt(BLIND_SPOT_ANGLE)}
    y2={X_ANNO_ARROW_TIP_Y}
    stroke={COL_ARROW}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#photoreceptor-arrow)"
  />
  {#if !isAnki}
    <text
      x={xAt(BLIND_SPOT_ANGLE)}
      y={X_ANNO_LABEL_Y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_FEATURE_LABEL}
      fill={COL_LABEL}
    >
      視神経乳頭
    </text>
  {/if}

  <!-- 盲点（プロット上、下向き矢印 + ラベル） -->
  <line
    x1={xAt(BLIND_SPOT_ANGLE)}
    y1={TOP_ANNO_ARROW_TAIL_Y}
    x2={xAt(BLIND_SPOT_ANGLE)}
    y2={TOP_ANNO_ARROW_TIP_Y}
    stroke={COL_ARROW}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#photoreceptor-arrow)"
  />
  {#if !isAnki}
    <text
      x={xAt(BLIND_SPOT_ANGLE)}
      y={TOP_ANNO_LABEL_Y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_FEATURE_LABEL}
      fill={COL_LABEL}
    >
      盲点
    </text>
  {/if}

  <!-- 凡例（プロット内右上） -->
  <g>
    <line
      x1={LEGEND_LINE_X1}
      y1={LEGEND_Y_CONE}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_Y_CONE}
      stroke={COL_CONE}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    {#if !isAnki}
      <text
        x={LEGEND_LABEL_X}
        y={LEGEND_Y_CONE}
        dominant-baseline="central"
        font-size={FONT_SIZE_LEGEND}
        fill={COL_LABEL}
      >
        錐体
      </text>
    {/if}
    <line
      x1={LEGEND_LINE_X1}
      y1={LEGEND_Y_ROD}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_Y_ROD}
      stroke={COL_ROD}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    {#if !isAnki}
      <text
        x={LEGEND_LABEL_X}
        y={LEGEND_Y_ROD}
        dominant-baseline="central"
        font-size={FONT_SIZE_LEGEND}
        fill={COL_LABEL}
      >
        桿体
      </text>
    {/if}
  </g>
</svg>
