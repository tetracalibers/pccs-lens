<script lang="ts">
  import { line, curveBasis } from "d3-shape"
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
  const FONT_SIZE_TICK_LABEL = 18
  const FONT_SIZE_AXIS_LABEL = 20
  const FONT_SIZE_Y_AXIS_LABEL = 20
  const FONT_SIZE_FEATURE_LABEL = 22
  const FONT_SIZE_LEGEND = 20

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 150 // PLOT_BOTTOM から軸ラベル中心まで
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
  // Østerberg 1935（古典） / Curcio et al. 1990（J. Comp. Neurol. 292:497-523）の
  // 計測値に基づく錐体・桿体密度データ（万個/mm²）
  // - 錐体ピーク: 14.7万/mm² @ 中心窩 (Østerberg 1935)
  // - 桿体ピーク: ~16万/mm² @ ±18° (eccentricity 5mm 付近、Østerberg)
  // - 桿体は中心窩 0.35mm (1.25°) で 0、5° 付近で 10万/mm² に到達
  // - 周辺 80° で 桿体 ~4万/mm²、錐体 ~0.4万/mm²
  // ※ 視神経乳頭の落ち込みは BLIND_SPOT_* で別途加算
  const CONE_DATA: DistributionPoint[] = [
    { angle: -80, value: 0.4 },
    { angle: -70, value: 0.4 },
    { angle: -60, value: 0.45 },
    { angle: -50, value: 0.5 },
    { angle: -40, value: 0.55 },
    { angle: -30, value: 0.65 },
    { angle: -20, value: 0.8 },
    { angle: -15, value: 0.9 },
    { angle: -10, value: 1.1 },
    { angle: -7, value: 1.4 },
    { angle: -5, value: 1.8 },
    { angle: -3, value: 2.6 },
    { angle: -2, value: 3.6 },
    { angle: -1.5, value: 4.5 },
    { angle: -1, value: 6.0 },
    { angle: -0.5, value: 9.5 },
    { angle: 0, value: 14.7 },
    { angle: 0.5, value: 9.5 },
    { angle: 1, value: 6.0 },
    { angle: 1.5, value: 4.5 },
    { angle: 2, value: 3.6 },
    { angle: 3, value: 2.6 },
    { angle: 5, value: 1.8 },
    { angle: 7, value: 1.4 },
    { angle: 10, value: 1.1 },
    { angle: 15, value: 0.9 },
    { angle: 20, value: 0.8 },
    { angle: 30, value: 0.65 },
    { angle: 40, value: 0.55 },
    { angle: 50, value: 0.5 },
    { angle: 60, value: 0.45 },
    { angle: 70, value: 0.4 },
    { angle: 80, value: 0.4 }
  ]

  const ROD_DATA: DistributionPoint[] = [
    { angle: -80, value: 4.0 },
    { angle: -70, value: 5.5 },
    { angle: -60, value: 7.5 },
    { angle: -50, value: 9.5 },
    { angle: -40, value: 11.5 },
    { angle: -30, value: 13.5 },
    { angle: -25, value: 14.8 },
    { angle: -22, value: 15.6 },
    { angle: -18, value: 16.0 },
    { angle: -15, value: 15.5 },
    { angle: -12, value: 14.5 },
    { angle: -10, value: 13.5 },
    { angle: -7, value: 11.5 },
    { angle: -5, value: 10.0 },
    { angle: -4, value: 8.0 },
    { angle: -3, value: 5.8 },
    { angle: -2, value: 3.2 },
    { angle: -1.5, value: 1.7 },
    { angle: -1, value: 0.6 },
    { angle: -0.7, value: 0.1 },
    { angle: -0.6, value: 0 },
    { angle: 0, value: 0 },
    { angle: 0.6, value: 0 },
    { angle: 0.7, value: 0.1 },
    { angle: 1, value: 0.6 },
    { angle: 1.5, value: 1.7 },
    { angle: 2, value: 3.2 },
    { angle: 3, value: 5.8 },
    { angle: 4, value: 8.0 },
    { angle: 5, value: 10.0 },
    { angle: 7, value: 11.5 },
    { angle: 10, value: 13.5 },
    { angle: 12, value: 14.5 },
    { angle: 15, value: 15.5 },
    { angle: 18, value: 16.0 },
    { angle: 22, value: 15.6 },
    { angle: 25, value: 14.8 },
    { angle: 30, value: 13.5 },
    { angle: 40, value: 11.5 },
    { angle: 50, value: 9.5 },
    { angle: 60, value: 7.5 },
    { angle: 70, value: 5.5 },
    { angle: 80, value: 4.0 }
  ]

  // 視神経乳頭で両曲線が 0 になる鋭いノッチ
  // スーパーガウシアン（n を大きくすると頂点が平らになり遷移が急になる）
  const superGauss = (x: number, sigma: number, n: number): number =>
    Math.exp(-Math.pow(Math.abs(x) / sigma, n))
  const BLIND_SPOT_SIGMA = 1.5
  const BLIND_SPOT_N = 4
  const blindSpotMask = (angle: number): number =>
    superGauss(angle - BLIND_SPOT_ANGLE, BLIND_SPOT_SIGMA, BLIND_SPOT_N)

  // データ表からの線形補間
  const interpolate = (data: DistributionPoint[], angle: number): number => {
    if (angle <= data[0].angle) return data[0].value
    if (angle >= data[data.length - 1].angle) return data[data.length - 1].value
    for (let i = 1; i < data.length; i++) {
      if (data[i].angle >= angle) {
        const prev = data[i - 1]
        const curr = data[i]
        const t = (angle - prev.angle) / (curr.angle - prev.angle)
        return prev.value + t * (curr.value - prev.value)
      }
    }
    return 0
  }

  const coneDensity = (angle: number): number =>
    interpolate(CONE_DATA, angle) * (1 - blindSpotMask(angle))
  const rodDensity = (angle: number): number =>
    interpolate(ROD_DATA, angle) * (1 - blindSpotMask(angle))

  // ===== サンプリング =====
  const SAMPLE_STEP = 0.5
  const sampleCount = Math.floor((ANGLE_MAX - ANGLE_MIN) / SAMPLE_STEP) + 1
  const sampleAngles = Array.from({ length: sampleCount }, (_, i) => ANGLE_MIN + i * SAMPLE_STEP)

  const cones: DistributionPoint[] = sampleAngles.map((angle) => ({
    angle,
    value: coneDensity(angle)
  }))
  const rods: DistributionPoint[] = sampleAngles.map((angle) => ({
    angle,
    value: rodDensity(angle)
  }))

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

  // ===== 滑らかなパス生成 =====
  // curveBasis（B-spline）で C² 連続のなめらかな曲線を描画
  // データ点は厳密には通らず、近傍点の平均で平滑化される
  const lineGen = line<DistributionPoint>()
    .x((d) => xAt(d.angle))
    .y((d) => yAt(d.value))
    .curve(curveBasis)

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
        {angle}°
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
    1mm^2 あたりの錐体・桿体の数（万個）
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
      text-anchor="end"
      dominant-baseline="central"
      font-size={FONT_SIZE_FEATURE_LABEL}
      fill={COL_LABEL}
      style="translate: 0.75rem 0;"
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
      text-anchor="start"
      dominant-baseline="central"
      font-size={FONT_SIZE_FEATURE_LABEL}
      fill={COL_LABEL}
      style="translate: -0.75rem 0;"
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
