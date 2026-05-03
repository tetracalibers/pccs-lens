<script lang="ts">
  interface SpectrumPoint {
    nm: number
    value: number
  }

  interface GradientStop {
    nm: number
    color: string
  }

  let {
    points,
    id
  }: {
    points: SpectrumPoint[]
    id: string
  } = $props()

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 110
  const PLOT_TOP = 30
  const MARGIN_RIGHT = 30
  const MARGIN_BOTTOM = 100
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 軸の範囲 =====
  const NM_MIN = 380
  const NM_MAX = 780
  const VALUE_MIN = 0
  const VALUE_MAX = 100

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const Y_TICK_INTERVAL = 50
  const X_LABELED_TICKS = [400, 500, 600, 700]
  const Y_LABELED_TICKS = [0, 50, 100]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 30

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // PLOT_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 80 // PLOT_LEFT から軸ラベル中心まで

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"

  // ===== グラデーションストップ（SpectrumGradient.svelte と同一） =====
  const gradientStops: GradientStop[] = [
    { nm: 380, color: "#4b0082" },
    { nm: 430, color: "#0000ff" },
    { nm: 480, color: "#00bfff" },
    { nm: 510, color: "#00ff80" },
    { nm: 550, color: "#00ff00" },
    { nm: 600, color: "#ffff00" },
    { nm: 640, color: "#ffb000" },
    { nm: 670, color: "#ff7f00" },
    { nm: 700, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
  ]

  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)

  // ===== 座標変換 =====
  const xAt = (nm: number): number =>
    PLOT_LEFT + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * PLOT_WIDTH
  const yAt = (value: number): number =>
    PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * PLOT_HEIGHT

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.floor((NM_MAX - 400) / X_TICK_INTERVAL) + 1 },
    (_, i) => 400 + i * X_TICK_INTERVAL
  )
  const yTicks = Array.from(
    { length: Math.floor((VALUE_MAX - VALUE_MIN) / Y_TICK_INTERVAL) + 1 },
    (_, i) => VALUE_MIN + i * Y_TICK_INTERVAL
  )

  // ===== Catmull-Rom 風の滑らかなパス生成 =====
  function smoothCurveSegments(pts: SpectrumPoint[]): string {
    if (pts.length === 0) return ""
    if (pts.length === 1) {
      const p = pts[0]
      return `M ${xAt(p.nm)} ${yAt(p.value)}`
    }

    let d = `M ${xAt(pts[0].nm)} ${yAt(pts[0].value)}`
    for (let i = 1; i < pts.length; i++) {
      const p0 = i > 1 ? pts[i - 2] : pts[i - 1]
      const p1 = pts[i - 1]
      const p2 = pts[i]
      const p3 = i < pts.length - 1 ? pts[i + 1] : pts[i]

      const cp1x = xAt(p1.nm) + (xAt(p2.nm) - xAt(p0.nm)) / 6
      const cp1y = yAt(p1.value) + (yAt(p2.value) - yAt(p0.value)) / 6
      const cp2x = xAt(p2.nm) - (xAt(p3.nm) - xAt(p1.nm)) / 6
      const cp2y = yAt(p2.value) - (yAt(p3.value) - yAt(p1.value)) / 6

      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${xAt(p2.nm)} ${yAt(p2.value)}`
    }
    return d
  }

  // ===== 横軸との間の領域を塗りつぶすパス =====
  const fillPath = $derived.by(() => {
    if (points.length === 0) return ""
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const curve = smoothCurveSegments(points)
    return `${curve} L ${xAt(lastPoint.nm)} ${PLOT_BOTTOM} L ${xAt(firstPoint.nm)} ${PLOT_BOTTOM} Z`
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <linearGradient
      id="spectrum-gradient-{id}"
      gradientUnits="userSpaceOnUse"
      x1={PLOT_LEFT}
      y1={0}
      x2={PLOT_RIGHT}
      y2={0}
    >
      {#each gradientStops as stop, i (i)}
        <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
      {/each}
    </linearGradient>
    <clipPath id="plot-clip-{id}">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
  </defs>

  <!-- グラフの塗りつぶし -->
  <path d={fillPath} fill="url(#spectrum-gradient-{id})" clip-path="url(#plot-clip-{id})" />

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
    {#each xTicks as nm (nm)}
      <line x1={xAt(nm)} y1={PLOT_BOTTOM} x2={xAt(nm)} y2={PLOT_BOTTOM + TICK_LENGTH} />
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
    {#each X_LABELED_TICKS as nm (nm)}
      <text x={xAt(nm)} y={PLOT_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {nm}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「波長 (nm)」 -->
  <text
    x={(PLOT_LEFT + PLOT_RIGHT) / 2}
    y={PLOT_BOTTOM + X_AXIS_LABEL_OFFSET}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
  >
    波長 (nm)
  </text>

  <!-- 縦軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="end">
    {#each Y_LABELED_TICKS as v (v)}
      <text x={PLOT_LEFT - Y_TICK_LABEL_OFFSET} y={yAt(v)} dominant-baseline="central">
        {v}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「比エネルギー (%)」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="tb-rl"
  >
    比エネルギー（％）
  </text>
</svg>
