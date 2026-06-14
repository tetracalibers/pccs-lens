<script lang="ts">
  import { line, curveBasis } from "d3-shape"

  interface EfficiencyPoint {
    nm: number
    value: number
  }

  interface GradientStop {
    nm: number
    color: string
  }

  // ===== SVG dimensions（CIE1931XYZColorMatchingGraph と同一スケール） =====
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

  // 横軸直下に表示する細いスペクトルグラデーション帯
  const SPECTRUM_BAND_HEIGHT = 14
  // 目盛り・数値ラベル・軸ラベルはスペクトル帯の下に配置するため、その下端を基準にする
  const X_AXIS_VISUAL_BOTTOM = PLOT_BOTTOM + SPECTRUM_BAND_HEIGHT

  // ===== 軸の範囲（XYZ等色関数グラフと同一） =====
  const NM_MIN = 380
  const NM_MAX = 700
  const VALUE_MIN = 0
  const VALUE_MAX = 1.8

  // ===== 目盛り設定（XYZ等色関数グラフと同一） =====
  const X_TICK_INTERVAL = 50
  const X_LABELED_TICKS = [400, 500, 600, 700]
  const Y_LABELED_TICKS = [0, 0.5, 1.0, 1.5]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 26

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // X_AXIS_VISUAL_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // X_AXIS_VISUAL_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 100 // PLOT_LEFT から軸ラベル中心まで

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_CURVE = 3

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  // 明るさの感じやすさ（分光視感効率）は緑の線で描く
  const COL_CURVE = "var(--canvas-pen-green)"

  // ===== スペクトル帯のグラデーション（SpectrumGradient.svelte と同一） =====
  // 波長と色の対応:
  //   紫 380〜430 / 藍 430〜460 / 青 460〜500 / 緑 500〜570
  //   黄 570〜590 / 橙 590〜610 / 赤 610〜780
  const gradientStops: GradientStop[] = [
    { nm: 405, color: "#4b0082" }, // 紫 中心
    { nm: 445, color: "#0000ff" }, // 藍 中心
    { nm: 480, color: "#00bfff" }, // 青 中心
    { nm: 535, color: "#00ff00" }, // 緑 中心
    { nm: 580, color: "#ffff00" }, // 黄 中心
    { nm: 600, color: "#ff7f00" }, // 橙 中心
    { nm: 620, color: "#ff0000" } // 赤
  ]
  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)

  // SVG 内 id の衝突を避けるための固定サフィックス
  const ID = "cone-luminous-efficiency"

  // ===== CIE 1924 明所視 V(λ) — 錐体ベースの相対視感効率（555nm にピーク = 1.0） =====
  // XYZ表色系では、この曲線が等色関数 ȳ(λ) と一致するように [Y] が定められている。
  const CONE_DATA: EfficiencyPoint[] = [
    { nm: 380, value: 0.000039 },
    { nm: 400, value: 0.000396 },
    { nm: 420, value: 0.004 },
    { nm: 440, value: 0.023 },
    { nm: 460, value: 0.06 },
    { nm: 480, value: 0.139 },
    { nm: 500, value: 0.323 },
    { nm: 510, value: 0.503 },
    { nm: 520, value: 0.71 },
    { nm: 530, value: 0.862 },
    { nm: 540, value: 0.954 },
    { nm: 550, value: 0.995 },
    { nm: 555, value: 1.0 },
    { nm: 560, value: 0.995 },
    { nm: 570, value: 0.952 },
    { nm: 580, value: 0.87 },
    { nm: 590, value: 0.757 },
    { nm: 600, value: 0.631 },
    { nm: 610, value: 0.503 },
    { nm: 620, value: 0.381 },
    { nm: 630, value: 0.265 },
    { nm: 640, value: 0.175 },
    { nm: 650, value: 0.107 },
    { nm: 660, value: 0.061 },
    { nm: 680, value: 0.017 },
    { nm: 700, value: 0.0041 }
  ]

  // データ表からの線形補間
  const interpolate = (data: EfficiencyPoint[], nm: number): number => {
    if (nm <= data[0].nm) return data[0].value
    if (nm >= data[data.length - 1].nm) return data[data.length - 1].value
    for (let i = 1; i < data.length; i++) {
      if (data[i].nm >= nm) {
        const prev = data[i - 1]
        const curr = data[i]
        const t = (nm - prev.nm) / (curr.nm - prev.nm)
        return prev.value + t * (curr.value - prev.value)
      }
    }
    return 0
  }

  // ===== サンプリング =====
  const SAMPLE_STEP = 10
  const sampleCount = Math.floor((NM_MAX - NM_MIN) / SAMPLE_STEP) + 1
  const sampleWavelengths = Array.from({ length: sampleCount }, (_, i) => NM_MIN + i * SAMPLE_STEP)
  const cones: EfficiencyPoint[] = sampleWavelengths.map((nm) => ({
    nm,
    value: interpolate(CONE_DATA, nm)
  }))

  // ===== 座標変換 =====
  const xAt = (nm: number): number => PLOT_LEFT + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * PLOT_WIDTH
  const yAt = (value: number): number =>
    PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * PLOT_HEIGHT

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.floor((NM_MAX - 400) / X_TICK_INTERVAL) + 1 },
    (_, i) => 400 + i * X_TICK_INTERVAL
  )

  const formatY = (v: number): string => (v === 0 ? "0" : v.toFixed(1))

  // ===== 滑らかなパス生成 =====
  // curveBasis（B-spline）で C² 連続のなめらかな曲線を描画
  const lineGen = line<EfficiencyPoint>()
    .x((d) => xAt(d.nm))
    .y((d) => yAt(d.value))
    .curve(curveBasis)
  const conesPath = lineGen(cones) ?? ""

  // ===== 凡例（プロット内・右上） =====
  const FONT_SIZE_LEGEND = 22
  const LEGEND_LINE_LENGTH = 48
  const LEGEND_LABEL_GAP = 22
  const LEGEND_MARGIN = 16 // プロット枠と凡例枠の間の余白
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 8.5 // 「錐体の分光視感効率」程度の幅

  // 凡例の枠線
  const LEGEND_FRAME_PADDING_X = 20
  const LEGEND_FRAME_PADDING_Y = 22
  const LEGEND_FRAME_RADIUS = 6
  const STROKE_WIDTH_LEGEND_FRAME = 1
  const LEGEND_CONTENT_WIDTH = LEGEND_LINE_LENGTH + LEGEND_LABEL_GAP + LEGEND_TEXT_WIDTH
  const LEGEND_FRAME_WIDTH = LEGEND_CONTENT_WIDTH + 2 * LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_HEIGHT = 2 * LEGEND_FRAME_PADDING_Y

  // 枠の位置（プロット内・右上）
  const LEGEND_FRAME_X = PLOT_RIGHT - LEGEND_FRAME_WIDTH - LEGEND_MARGIN
  const LEGEND_FRAME_Y = PLOT_TOP + LEGEND_MARGIN
  const LEGEND_FRAME_CENTER_X = LEGEND_FRAME_X + LEGEND_FRAME_WIDTH / 2

  // 内側コンテンツの位置（枠の水平中央に揃える）
  const LEGEND_LINE_X1 = LEGEND_FRAME_CENTER_X - LEGEND_CONTENT_WIDTH / 2
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_LABEL_CENTER_X = LEGEND_LABEL_X + LEGEND_TEXT_WIDTH / 2
  const LEGEND_ROW_Y = LEGEND_FRAME_Y + LEGEND_FRAME_HEIGHT / 2
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="plot-clip-{ID}">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
    <linearGradient id="spectrum-band-{ID}" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- 縦軸 -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_TOP}
    x2={PLOT_LEFT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 横軸（プロット下端） -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_BOTTOM}
    x2={PLOT_RIGHT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 横軸直下のスペクトルグラデーション帯 -->
  <rect
    x={PLOT_LEFT}
    y={PLOT_BOTTOM}
    width={PLOT_WIDTH}
    height={SPECTRUM_BAND_HEIGHT}
    fill="url(#spectrum-band-{ID})"
  />

  <!-- 横軸の目盛り（スペクトル帯の下） -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each xTicks as nm (nm)}
      <line
        x1={xAt(nm)}
        y1={X_AXIS_VISUAL_BOTTOM}
        x2={xAt(nm)}
        y2={X_AXIS_VISUAL_BOTTOM + TICK_LENGTH}
      />
    {/each}
  </g>

  <!-- 縦軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each Y_LABELED_TICKS as v (v)}
      <line x1={PLOT_LEFT} y1={yAt(v)} x2={PLOT_LEFT - TICK_LENGTH} y2={yAt(v)} />
    {/each}
  </g>

  <!-- 分光視感効率の曲線（錐体・緑） -->
  <g clip-path="url(#plot-clip-{ID})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d={conesPath} stroke={COL_CURVE} stroke-width={STROKE_WIDTH_CURVE} />
  </g>

  <!-- 横軸の数値ラベル（スペクトル帯の下） -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="middle">
    {#each X_LABELED_TICKS as nm (nm)}
      <text x={xAt(nm)} y={X_AXIS_VISUAL_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {nm}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「波長 (nm)」 -->
  <text
    x={(PLOT_LEFT + PLOT_RIGHT) / 2}
    y={X_AXIS_VISUAL_BOTTOM + X_AXIS_LABEL_OFFSET}
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
        {formatY(v)}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「明るさの感じやすさ」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    明るさの感じやすさ
  </text>

  <!-- 凡例（プロット内・右上） -->
  <g>
    <rect
      x={LEGEND_FRAME_X}
      y={LEGEND_FRAME_Y}
      width={LEGEND_FRAME_WIDTH}
      height={LEGEND_FRAME_HEIGHT}
      rx={LEGEND_FRAME_RADIUS}
      fill="none"
      stroke="light-dark(lightslategray, gray)"
      stroke-width={STROKE_WIDTH_LEGEND_FRAME}
    />
    <line
      x1={LEGEND_LINE_X1}
      y1={LEGEND_ROW_Y}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_ROW_Y}
      stroke={COL_CURVE}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    <text
      x={LEGEND_LABEL_CENTER_X}
      y={LEGEND_ROW_Y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_LEGEND}
      fill={COL_LABEL}
    >
      錐体の分光視感効率
    </text>
  </g>
</svg>
