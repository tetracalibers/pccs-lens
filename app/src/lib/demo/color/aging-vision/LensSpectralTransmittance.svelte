<script lang="ts">
  import { line, curveBasis } from "d3-shape"

  interface DensityPoint {
    nm: number
    density: number
  }

  interface TransmittancePoint {
    nm: number
    value: number
  }

  interface AgeCurve {
    age: number
    color: string
    path: string
  }

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 130
  const PLOT_TOP = 30
  const MARGIN_RIGHT = 30
  const MARGIN_BOTTOM = 100
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 軸の範囲 =====
  const NM_MIN = 400
  const NM_MAX = 650
  const VALUE_MIN = 0
  const VALUE_MAX = 1.0

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const Y_TICK_INTERVAL = 0.2
  const X_LABELED_TICKS = [400, 450, 500, 550, 600, 650]
  const Y_LABELED_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 30
  const FONT_SIZE_LEGEND = 24

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // PLOT_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで

  // 数値ラベルと軸ラベルの間隔。縦軸を横軸と同じ間隔に揃えるため、
  // 横軸側の間隔（両ラベルの外縁どうしの距離）を求めて縦軸の位置を逆算する
  const AXIS_LABEL_GAP =
    X_AXIS_LABEL_OFFSET - X_TICK_LABEL_OFFSET - FONT_SIZE_TICK_LABEL / 2 - FONT_SIZE_AXIS_LABEL / 2
  const Y_TICK_LABEL_WIDTH = FONT_SIZE_TICK_LABEL * 1.5 // 「0.0」(数字2 + ピリオド1) のおおよその幅
  // 縦書きの軸ラベルは横並びの数値と隣り合うぶん、横軸と同じ間隔では詰まって見えるため上乗せする
  const Y_AXIS_LABEL_EXTRA_GAP = 16
  // PLOT_LEFT から軸ラベル中心まで
  const Y_AXIS_LABEL_OFFSET =
    Y_TICK_LABEL_OFFSET +
    Y_TICK_LABEL_WIDTH +
    AXIS_LABEL_GAP +
    Y_AXIS_LABEL_EXTRA_GAP +
    FONT_SIZE_AXIS_LABEL / 2

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_CURVE = 4

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_LEGEND_FRAME = "light-dark(lightslategray, gray)"
  // 年齢が上がるほど暖色側へ寄せ、加齢の進行が読み取れるようにする
  const COL_AGE_20 = "var(--canvas-pen-blue)"
  const COL_AGE_40 = "var(--canvas-pen-green)"
  const COL_AGE_60 = "var(--canvas-pen-orange)"
  const COL_AGE_80 = "var(--canvas-pen-red)"

  // ===== 水晶体の分光透過率モデル =====
  // Pokorny, Smith & Lutze (1987) の加齢モデルに基づく。
  // 32歳の水晶体の分光光学濃度 D32(λ) に年齢係数 k(A) を掛け、透過率 T = 10^(-D) を求める。
  //   A <= 60: k(A) = 1 + 0.02 * (A - 32)
  //   A >  60: k(A) = 1.56 + 0.0667 * (A - 56)
  // 短波長ほど濃度が高いため、加齢による透過率の低下も短波長側で大きくなる。
  const DENSITY_32: DensityPoint[] = [
    { nm: 400, density: 1.1 },
    { nm: 410, density: 0.95 },
    { nm: 420, density: 0.83 },
    { nm: 430, density: 0.72 },
    { nm: 440, density: 0.63 },
    { nm: 450, density: 0.56 },
    { nm: 460, density: 0.49 },
    { nm: 470, density: 0.43 },
    { nm: 480, density: 0.38 },
    { nm: 490, density: 0.33 },
    { nm: 500, density: 0.29 },
    { nm: 510, density: 0.25 },
    { nm: 520, density: 0.22 },
    { nm: 530, density: 0.19 },
    { nm: 540, density: 0.16 },
    { nm: 550, density: 0.14 },
    { nm: 560, density: 0.12 },
    { nm: 570, density: 0.1 },
    { nm: 580, density: 0.085 },
    { nm: 590, density: 0.07 },
    { nm: 600, density: 0.06 },
    { nm: 610, density: 0.05 },
    { nm: 620, density: 0.04 },
    { nm: 630, density: 0.032 },
    { nm: 640, density: 0.025 },
    { nm: 650, density: 0.02 }
  ]

  // ===== 描画する年齢 =====
  const AGES: { age: number; color: string }[] = [
    { age: 20, color: COL_AGE_20 },
    { age: 40, color: COL_AGE_40 },
    { age: 60, color: COL_AGE_60 },
    { age: 80, color: COL_AGE_80 }
  ]

  const ageFactor = (age: number): number =>
    age <= 60 ? 1 + 0.02 * (age - 32) : 1.56 + 0.0667 * (age - 56)

  // データ表からの線形補間
  const interpolateDensity = (nm: number): number => {
    if (nm <= DENSITY_32[0].nm) return DENSITY_32[0].density
    const last = DENSITY_32[DENSITY_32.length - 1]
    if (nm >= last.nm) return last.density
    for (let i = 1; i < DENSITY_32.length; i++) {
      if (DENSITY_32[i].nm >= nm) {
        const prev = DENSITY_32[i - 1]
        const curr = DENSITY_32[i]
        const t = (nm - prev.nm) / (curr.nm - prev.nm)
        return prev.density + t * (curr.density - prev.density)
      }
    }
    return 0
  }

  // ===== サンプリング =====
  const SAMPLE_STEP = 5
  const sampleCount = Math.floor((NM_MAX - NM_MIN) / SAMPLE_STEP) + 1
  const sampleWavelengths = Array.from({ length: sampleCount }, (_, i) => NM_MIN + i * SAMPLE_STEP)

  const transmittanceAt = (nm: number, age: number): number =>
    Math.pow(10, -interpolateDensity(nm) * ageFactor(age))

  // ===== 座標変換 =====
  const xAt = (nm: number): number => PLOT_LEFT + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * PLOT_WIDTH
  const yAt = (value: number): number =>
    PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * PLOT_HEIGHT

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.floor((NM_MAX - NM_MIN) / X_TICK_INTERVAL) + 1 },
    (_, i) => NM_MIN + i * X_TICK_INTERVAL
  )
  const yTicks = Array.from(
    { length: Math.floor((VALUE_MAX - VALUE_MIN) / Y_TICK_INTERVAL) + 1 },
    (_, i) => VALUE_MIN + i * Y_TICK_INTERVAL
  )

  // ===== 曲線のパス生成 =====
  // curveBasis（B-spline）で C² 連続のなめらかな曲線を描画
  const lineGen = line<TransmittancePoint>()
    .x((d) => xAt(d.nm))
    .y((d) => yAt(d.value))
    .curve(curveBasis)

  const curves: AgeCurve[] = AGES.map(({ age, color }) => ({
    age,
    color,
    path: lineGen(sampleWavelengths.map((nm) => ({ nm, value: transmittanceAt(nm, age) }))) ?? ""
  }))

  // 年長の曲線から先に描き、若年の曲線を手前に重ねる
  const drawOrder = [...curves].reverse()

  // ===== 凡例（プロット内左上） =====
  const LEGEND_LINE_LENGTH = 56
  const LEGEND_ROW_GAP = 32
  const LEGEND_LABEL_GAP = 14
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 2.2 // 「20歳」(数字2 + 全角1) のおおよその幅

  // 凡例の枠線
  const LEGEND_FRAME_PADDING_X = 18
  const LEGEND_FRAME_PADDING_Y = 22
  const LEGEND_FRAME_RADIUS = 6
  const STROKE_WIDTH_LEGEND_FRAME = 1
  const LEGEND_CONTENT_WIDTH = LEGEND_LINE_LENGTH + LEGEND_LABEL_GAP + LEGEND_TEXT_WIDTH
  const LEGEND_FRAME_WIDTH = LEGEND_CONTENT_WIDTH + 2 * LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_HEIGHT = LEGEND_ROW_GAP * (AGES.length - 1) + 2 * LEGEND_FRAME_PADDING_Y

  // 枠の位置（左上アンカー：曲線が最も低くなる短波長側の上部を使う）
  const LEGEND_FRAME_X = PLOT_LEFT + 24
  const LEGEND_FRAME_Y = PLOT_TOP + 12
  const LEGEND_FRAME_CENTER_X = LEGEND_FRAME_X + LEGEND_FRAME_WIDTH / 2

  // 内側コンテンツの位置（枠の水平中央に揃える）
  const LEGEND_LINE_X1 = LEGEND_FRAME_CENTER_X - LEGEND_CONTENT_WIDTH / 2
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_LABEL_CENTER_X = LEGEND_LABEL_X + LEGEND_TEXT_WIDTH / 2
  const LEGEND_ROW_Y = (index: number): number =>
    LEGEND_FRAME_Y + LEGEND_FRAME_PADDING_Y + index * LEGEND_ROW_GAP
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="lens-transmittance-plot-clip">
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
        {v.toFixed(1)}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「分光透過率」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    分光透過率
  </text>

  <!-- 年齢ごとの分光透過率曲線 -->
  {#each drawOrder as curve (curve.age)}
    <path
      d={curve.path}
      fill="none"
      stroke={curve.color}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linejoin="round"
      stroke-linecap="round"
      clip-path="url(#lens-transmittance-plot-clip)"
    />
  {/each}

  <!-- 凡例（プロット内左上） -->
  <g>
    <rect
      x={LEGEND_FRAME_X}
      y={LEGEND_FRAME_Y}
      width={LEGEND_FRAME_WIDTH}
      height={LEGEND_FRAME_HEIGHT}
      rx={LEGEND_FRAME_RADIUS}
      fill="none"
      stroke={COL_LEGEND_FRAME}
      stroke-width={STROKE_WIDTH_LEGEND_FRAME}
    />
    {#each curves as curve, i (curve.age)}
      <line
        x1={LEGEND_LINE_X1}
        y1={LEGEND_ROW_Y(i)}
        x2={LEGEND_LINE_X2}
        y2={LEGEND_ROW_Y(i)}
        stroke={curve.color}
        stroke-width={STROKE_WIDTH_CURVE}
        stroke-linecap="round"
      />
      <text
        x={LEGEND_LABEL_CENTER_X}
        y={LEGEND_ROW_Y(i)}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={FONT_SIZE_LEGEND}
        fill={COL_LABEL}
      >
        {curve.age}歳
      </text>
    {/each}
  </g>
</svg>
