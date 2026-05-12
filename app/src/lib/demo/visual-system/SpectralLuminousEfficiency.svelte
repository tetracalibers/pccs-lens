<script lang="ts">
  import { line, curveBasis } from "d3-shape"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface EfficiencyPoint {
    nm: number
    value: number
  }

  interface GradientStop {
    nm: number
    color: string
  }

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 110
  const PLOT_TOP = 80
  const MARGIN_RIGHT = 100
  const MARGIN_BOTTOM = 215
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // 横軸直下に表示する細いスペクトルグラデーション帯
  const SPECTRUM_BAND_HEIGHT = 14
  // 目盛り・数値ラベル・注釈はスペクトル帯の下に配置するため、その下端を基準にする
  const X_AXIS_VISUAL_BOTTOM = PLOT_BOTTOM + SPECTRUM_BAND_HEIGHT

  // ===== 軸の範囲 =====
  const NM_MIN = 380
  const NM_MAX = 780
  const VALUE_MIN = 0
  // 1.0 ちょうどではなく少し上に余裕を取ることで、ピーク付近で曲線がクリップされるのを防ぐ
  const VALUE_MAX = 1.05

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const Y_TICK_INTERVAL = 0.2
  const X_LABELED_TICKS = [400, 450, 500, 550, 600, 650, 700, 750]
  const Y_LABELED_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 20
  const FONT_SIZE_AXIS_LABEL = 24
  const FONT_SIZE_Y_AXIS_LABEL = 24
  const FONT_SIZE_FEATURE_LABEL = 30
  const FONT_SIZE_LEGEND = 24

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // X_AXIS_VISUAL_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 56 // X_AXIS_VISUAL_BOTTOM から軸ラベル中心まで
  const X_AXIS_LABEL_GAP_FROM_LAST_TICK = 30 // 最後の目盛りラベル(750)から波長ラベル左端までの余白
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 80 // PLOT_LEFT から軸ラベル中心まで

  // ===== 注釈用矢印・ラベル位置（X軸下部） =====
  const X_ANNO_ARROW_TIP_Y = X_AXIS_VISUAL_BOTTOM + 52
  const X_ANNO_ARROW_TAIL_Y = X_AXIS_VISUAL_BOTTOM + 92
  const X_ANNO_LABEL_Y_LINE1 = X_AXIS_VISUAL_BOTTOM + 122
  const X_ANNO_LABEL_Y_LINE2 = X_AXIS_VISUAL_BOTTOM + 162

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_CURVE = 4
  const STROKE_WIDTH_ARROW = 3

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_CONE = PCCS_HEX_MAP.get("lt2")! // 錐体（赤）
  const COL_ROD = PCCS_HEX_MAP.get("lt18")! // 桿体（青）

  // ===== 矢の形状 =====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 24
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_ARROW * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 特徴点の波長 =====
  const ROD_PEAK_NM = 507
  const CONE_PEAK_NM = 555

  // ===== 凡例（プロット内右上） =====
  const LEGEND_LINE_LENGTH = 56
  const LEGEND_ROW_GAP = 32
  const LEGEND_LABEL_GAP = 14
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 2.0 // 「錐体」「桿体」(2 全角文字) のおおよその幅

  // 凡例の枠線
  const LEGEND_FRAME_PADDING_X = 18
  const LEGEND_FRAME_PADDING_Y = 22
  const LEGEND_FRAME_RADIUS = 6
  const STROKE_WIDTH_LEGEND_FRAME = 1
  const LEGEND_CONTENT_WIDTH = LEGEND_LINE_LENGTH + LEGEND_LABEL_GAP + LEGEND_TEXT_WIDTH
  const LEGEND_FRAME_WIDTH = LEGEND_CONTENT_WIDTH + 2 * LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_HEIGHT = LEGEND_ROW_GAP + 2 * LEGEND_FRAME_PADDING_Y

  // 枠の位置（右上アンカー）
  const LEGEND_FRAME_X = PLOT_RIGHT - 150 - LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_Y = PLOT_TOP + 28 - LEGEND_FRAME_PADDING_Y
  const LEGEND_FRAME_CENTER_X = LEGEND_FRAME_X + LEGEND_FRAME_WIDTH / 2

  // 内側コンテンツの位置（枠の水平中央に揃える）
  const LEGEND_LINE_X1 = LEGEND_FRAME_CENTER_X - LEGEND_CONTENT_WIDTH / 2
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_LABEL_CENTER_X = LEGEND_LABEL_X + LEGEND_TEXT_WIDTH / 2
  const LEGEND_Y_CONE = LEGEND_FRAME_Y + LEGEND_FRAME_PADDING_Y
  const LEGEND_Y_ROD = LEGEND_Y_CONE + LEGEND_ROW_GAP

  // ===== スペクトル帯のグラデーション =====
  // 元の色（hex）を保ったまま、波長と色の対応に合わせて配置のみ調整:
  //   紫 380〜430 / 藍 430〜460 / 青 460〜500 / 緑 500〜570
  //   黄 570〜590 / 橙 590〜610 / 赤 610〜780
  // 各色を範囲の中心付近に置き、隣接色との間で自然に遷移させる
  const gradientStops: GradientStop[] = [
    { nm: 405, color: "#4b0082" }, // 紫 中心
    { nm: 445, color: "#0000ff" }, // 藍 中心
    { nm: 480, color: "#00bfff" }, // 青 中心
    { nm: 535, color: "#00ff00" }, // 緑 中心
    { nm: 580, color: "#ffff00" }, // 黄 中心
    { nm: 600, color: "#ff7f00" }, // 橙 中心
    { nm: 620, color: "#ff0000" }, // 赤 入り口（純赤）
    { nm: 780, color: "#7a0000" } // 赤 帯端
  ]
  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)

  // ===== CIE 分光視感効率データ =====
  // CIE 1924 明所視 V(λ) — 錐体ベースの相対視感効率（555nm にピーク = 1.0）
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
    { nm: 700, value: 0.0041 },
    { nm: 720, value: 0.001 },
    { nm: 740, value: 0.00025 },
    { nm: 760, value: 0.00006 },
    { nm: 780, value: 0.000015 }
  ]
  // CIE 1951 暗所視 V'(λ) — 桿体ベースの相対視感効率（507nm にピーク = 1.0）
  const ROD_DATA: EfficiencyPoint[] = [
    { nm: 380, value: 0.000589 },
    { nm: 400, value: 0.00929 },
    { nm: 420, value: 0.0966 },
    { nm: 440, value: 0.328 },
    { nm: 450, value: 0.455 },
    { nm: 460, value: 0.567 },
    { nm: 470, value: 0.676 },
    { nm: 480, value: 0.793 },
    { nm: 490, value: 0.904 },
    { nm: 500, value: 0.982 },
    { nm: 507, value: 1.0 },
    { nm: 510, value: 0.997 },
    { nm: 520, value: 0.935 },
    { nm: 530, value: 0.811 },
    { nm: 540, value: 0.65 },
    { nm: 550, value: 0.481 },
    { nm: 560, value: 0.329 },
    { nm: 570, value: 0.208 },
    { nm: 580, value: 0.121 },
    { nm: 590, value: 0.0655 },
    { nm: 600, value: 0.0332 },
    { nm: 610, value: 0.0159 },
    { nm: 620, value: 0.00737 },
    { nm: 630, value: 0.00334 },
    { nm: 640, value: 0.0015 },
    { nm: 660, value: 0.000313 },
    { nm: 680, value: 0.000072 },
    { nm: 700, value: 0.000018 },
    { nm: 780, value: 0 }
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
  const rods: EfficiencyPoint[] = sampleWavelengths.map((nm) => ({
    nm,
    value: interpolate(ROD_DATA, nm)
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
  const yTicks = Array.from(
    { length: Math.floor((VALUE_MAX - VALUE_MIN) / Y_TICK_INTERVAL) + 1 },
    (_, i) => VALUE_MIN + i * Y_TICK_INTERVAL
  )

  // ===== 滑らかなパス生成 =====
  // curveBasis（B-spline）で C² 連続のなめらかな曲線を描画
  const lineGen = line<EfficiencyPoint>()
    .x((d) => xAt(d.nm))
    .y((d) => yAt(d.value))
    .curve(curveBasis)

  const conesPath = lineGen(cones) ?? ""
  const rodsPath = lineGen(rods) ?? ""

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <marker
      id="luminous-efficiency-arrow-cone"
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
        stroke={COL_CONE}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
    <marker
      id="luminous-efficiency-arrow-rod"
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
        stroke={COL_ROD}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
    <clipPath id="luminous-efficiency-plot-clip">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
    <linearGradient id="luminous-efficiency-spectrum-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
      {/each}
    </linearGradient>
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

  <!-- 縦軸（最上目盛り 1.0 を終点とする） -->
  <line
    x1={PLOT_LEFT}
    y1={yAt(1.0)}
    x2={PLOT_LEFT}
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
    fill="url(#luminous-efficiency-spectrum-gradient)"
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
    {#each yTicks as v (v)}
      <line x1={PLOT_LEFT} y1={yAt(v)} x2={PLOT_LEFT - TICK_LENGTH} y2={yAt(v)} />
    {/each}
  </g>

  <!-- 横軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="middle">
    {#each X_LABELED_TICKS as nm (nm)}
      <text x={xAt(nm)} y={X_AXIS_VISUAL_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {nm}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「波長 (nm)」（最後の目盛りラベル(750)の右に配置） -->
  <text
    x={xAt(750) + X_AXIS_LABEL_GAP_FROM_LAST_TICK}
    y={X_AXIS_VISUAL_BOTTOM + X_AXIS_LABEL_OFFSET}
    text-anchor="start"
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

  <!-- 縦軸ラベル「CIE分光視感効率」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_Y_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    CIE分光視感効率
  </text>

  <!-- 桿体の曲線（青） -->
  <path
    d={rodsPath}
    fill="none"
    stroke={COL_ROD}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#luminous-efficiency-plot-clip)"
  />

  <!-- 錐体の曲線（赤） -->
  <path
    d={conesPath}
    fill="none"
    stroke={COL_CONE}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#luminous-efficiency-plot-clip)"
  />

  <!-- 桿体の最高感度 (507nm)：X軸下、上向き矢印 + 2行ラベル -->
  <line
    x1={xAt(ROD_PEAK_NM)}
    y1={X_ANNO_ARROW_TAIL_Y}
    x2={xAt(ROD_PEAK_NM)}
    y2={X_ANNO_ARROW_TIP_Y}
    stroke={COL_ROD}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#luminous-efficiency-arrow-rod)"
  />
  <text
    x={xAt(ROD_PEAK_NM)}
    y={X_ANNO_LABEL_Y_LINE1}
    text-anchor="end"
    dominant-baseline="central"
    font-size={FONT_SIZE_FEATURE_LABEL}
    font-weight="bold"
    fill={COL_ROD}
    style="translate: 0.5em 0;"
  >
    <tspan visibility={isAnki ? "hidden" : "visible"}>桿体</tspan>
    <tspan>の最高感度</tspan>
  </text>
  <text
    x={xAt(ROD_PEAK_NM)}
    y={X_ANNO_LABEL_Y_LINE2}
    text-anchor="end"
    dominant-baseline="central"
    font-size={FONT_SIZE_FEATURE_LABEL}
    font-weight="bold"
    fill={COL_ROD}
    style="translate: 0.5em 0;"
  >
    <tspan visibility={isAnki ? "hidden" : "visible"}>507</tspan>
    <tspan dx="-0.4em">nm</tspan>
  </text>

  <!-- 錐体の最高感度 (555nm)：X軸下、上向き矢印 + 2行ラベル -->
  <line
    x1={xAt(CONE_PEAK_NM)}
    y1={X_ANNO_ARROW_TAIL_Y}
    x2={xAt(CONE_PEAK_NM)}
    y2={X_ANNO_ARROW_TIP_Y}
    stroke={COL_CONE}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#luminous-efficiency-arrow-cone)"
  />
  <text
    x={xAt(CONE_PEAK_NM)}
    y={X_ANNO_LABEL_Y_LINE1}
    text-anchor="start"
    dominant-baseline="central"
    font-size={FONT_SIZE_FEATURE_LABEL}
    font-weight="bold"
    fill={COL_CONE}
    style="translate: -0.5em 0;"
  >
    <tspan visibility={isAnki ? "hidden" : "visible"}>錐体</tspan>
    <tspan>の最高感度</tspan>
  </text>
  <text
    x={xAt(CONE_PEAK_NM)}
    y={X_ANNO_LABEL_Y_LINE2}
    text-anchor="start"
    dominant-baseline="central"
    font-size={FONT_SIZE_FEATURE_LABEL}
    font-weight="bold"
    fill={COL_CONE}
    style="translate: -0.5em 0;"
  >
    <tspan visibility={isAnki ? "hidden" : "visible"}>555</tspan>
    <tspan dx="-0.4em">nm</tspan>
  </text>

  <!-- 凡例（プロット内右上） -->
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
      y1={LEGEND_Y_CONE}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_Y_CONE}
      stroke={COL_CONE}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    {#if !isAnki}
      <text
        x={LEGEND_LABEL_CENTER_X}
        y={LEGEND_Y_CONE}
        text-anchor="middle"
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
        x={LEGEND_LABEL_CENTER_X}
        y={LEGEND_Y_ROD}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={FONT_SIZE_LEGEND}
        fill={COL_LABEL}
      >
        桿体
      </text>
    {/if}
  </g>
</svg>
