<script lang="ts">
  import { line, curveBasis } from "d3-shape"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface SensitivityPoint {
    nm: number
    value: number
  }

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 110
  const PLOT_TOP = 30
  const MARGIN_RIGHT = 40
  const MARGIN_BOTTOM = 170
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 軸の範囲 =====
  const NM_MIN = 380
  const NM_MAX = 780
  const VALUE_MIN = 0
  const VALUE_MAX = 2

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const Y_TICK_INTERVAL = 0.5
  const X_LABELED_TICKS = [400, 500, 600, 700]
  const Y_LABELED_TICKS = [0, 0.5, 1, 1.5, 2]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 20
  const FONT_SIZE_AXIS_LABEL = 26
  const FONT_SIZE_CURVE_LABEL = 30

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_Y_OFFSET = 46 // PLOT_BOTTOM から波長ラベル中心まで
  const X_AXIS_LABEL_GAP_FROM_LAST_TICK = 50 // 700 の目盛りラベルから波長ラベル左端までの余白
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 80 // PLOT_LEFT から軸ラベル中心まで

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_CURVE = 3.5
  const STROKE_WIDTH_RANGE_ARROW = 2

  // ===== 波長範囲注釈 =====
  const RANGE_ARROW_Y_OFFSET = X_AXIS_LABEL_Y_OFFSET * 1.8 // PLOT_BOTTOM から矢線中心まで
  const RANGE_LABEL_Y_OFFSET = RANGE_ARROW_Y_OFFSET + X_AXIS_LABEL_Y_OFFSET * 0.7 // PLOT_BOTTOM から範囲ラベル中心まで
  const FONT_SIZE_RANGE_LABEL = 24

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 22
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_RANGE_ARROW * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_S = PCCS_HEX_MAP.get("lt18")! // S錐体
  const COL_M = PCCS_HEX_MAP.get("lt12")! // M錐体
  const COL_L = PCCS_HEX_MAP.get("lt2")! // L錐体

  // ===== 波長範囲 =====
  const ranges = [
    {
      id: "short",
      from: 380,
      to: 500,
      label: "短波長",
      color: "var(--canvas-pen-blue)"
    },
    {
      id: "mid",
      from: 500,
      to: 600,
      label: "中波長",
      color: "var(--canvas-pen-green)"
    },
    {
      id: "long",
      from: 600,
      to: 780,
      label: "長波長",
      color: "var(--canvas-pen-red)"
    }
  ]

  // ===== 錐体パラメータ =====
  // 教科書で典型的に示される非正規化スケール（曲線の幅と相関した相対ピーク高さ）。
  // Stockman & Sharpe 2°錐体基本関数の形状を非対称ガウスで近似し、
  // ピーク高さを各細胞ごとに与えて S >> M ≈ L のヒエラルキーを再現する。
  const S_PEAK_NM = 430
  const S_PEAK_HEIGHT = 1.65
  const S_SIGMA_L = 15 // 眼の媒体（水晶体）による短波長側カットを反映した急峻な立ち上がり
  const S_SIGMA_R = 28 // 中波長域へ向けて急激に減衰

  const M_PEAK_NM = 540
  const M_PEAK_HEIGHT = 1.1
  const M_SIGMA_L = 40
  const M_SIGMA_R = 40

  const L_PEAK_NM = 565
  const L_PEAK_HEIGHT = 1.03
  const L_SIGMA_L = 55 // 中波長側はゆるやかに広がりM錐体と大きく重なる
  const L_SIGMA_R = 45

  // ===== 感度関数（左右非対称ガウス） =====
  const asymGauss = (
    nm: number,
    peak: number,
    sigmaL: number,
    sigmaR: number,
    height: number
  ): number => {
    const sigma = nm < peak ? sigmaL : sigmaR
    return height * Math.exp(-0.5 * Math.pow((nm - peak) / sigma, 2))
  }

  const sSensitivity = (nm: number): number =>
    asymGauss(nm, S_PEAK_NM, S_SIGMA_L, S_SIGMA_R, S_PEAK_HEIGHT)
  const mSensitivity = (nm: number): number =>
    asymGauss(nm, M_PEAK_NM, M_SIGMA_L, M_SIGMA_R, M_PEAK_HEIGHT)
  const lSensitivity = (nm: number): number =>
    asymGauss(nm, L_PEAK_NM, L_SIGMA_L, L_SIGMA_R, L_PEAK_HEIGHT)

  // ===== サンプリング =====
  const SAMPLE_STEP = 1
  const sampleCount = Math.floor((NM_MAX - NM_MIN) / SAMPLE_STEP) + 1
  const sampleWavelengths = Array.from({ length: sampleCount }, (_, i) => NM_MIN + i * SAMPLE_STEP)

  const sCurveData: SensitivityPoint[] = sampleWavelengths.map((nm) => ({
    nm,
    value: sSensitivity(nm)
  }))
  const mCurveData: SensitivityPoint[] = sampleWavelengths.map((nm) => ({
    nm,
    value: mSensitivity(nm)
  }))
  const lCurveData: SensitivityPoint[] = sampleWavelengths.map((nm) => ({
    nm,
    value: lSensitivity(nm)
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

  // ===== 滑らかなパス生成（curveBasis = B-spline 風で角がカクつかない） =====
  const lineGen = line<SensitivityPoint>()
    .x((d) => xAt(d.nm))
    .y((d) => yAt(d.value))
    .curve(curveBasis)

  const sPath = lineGen(sCurveData) ?? ""
  const mPath = lineGen(mCurveData) ?? ""
  const lPath = lineGen(lCurveData) ?? ""

  // ===== 曲線ラベル位置（ピークの上） =====
  // S: ピーク真上（中央揃え）／ M: ピーク上の左寄り（右端揃え）／ L: ピーク上の右寄り（左端揃え）
  const S_LABEL_NM = S_PEAK_NM
  const S_LABEL_VALUE = 1.85
  const M_LABEL_NM = 530
  const M_LABEL_VALUE = 1.3
  const L_LABEL_NM = 575
  const L_LABEL_VALUE = 1.23

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="spectral-sensitivity-plot-clip">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
    {#each ranges as r (r.id)}
      <marker
        id="range-arrow-{r.id}"
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
          stroke={r.color}
          stroke-width={ARROW_HEAD_STROKE}
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="translate(1.1667 1.75)"
        />
      </marker>
    {/each}
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

  <!-- 横軸ラベル「波長 (nm)」（700 の目盛りラベルの右、横軸からは少し下げる） -->
  <text
    x={xAt(700) + X_AXIS_LABEL_GAP_FROM_LAST_TICK}
    y={PLOT_BOTTOM + X_AXIS_LABEL_Y_OFFSET}
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
        {v}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「感度」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    感度
  </text>

  <!-- 波長範囲の両側矢印と範囲ラベル -->
  {#each ranges as r (r.id)}
    <line
      x1={xAt(r.from)}
      y1={PLOT_BOTTOM + RANGE_ARROW_Y_OFFSET}
      x2={xAt(r.to)}
      y2={PLOT_BOTTOM + RANGE_ARROW_Y_OFFSET}
      stroke={r.color}
      stroke-width={STROKE_WIDTH_RANGE_ARROW}
      marker-start="url(#range-arrow-{r.id})"
      marker-end="url(#range-arrow-{r.id})"
    />
    <text
      x={(xAt(r.from) + xAt(r.to)) / 2}
      y={PLOT_BOTTOM + RANGE_LABEL_Y_OFFSET}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_RANGE_LABEL}
      fill={r.color}
    >
      {r.label}
    </text>
  {/each}

  <!-- S錐体の曲線（青） -->
  <path
    d={sPath}
    fill="none"
    stroke={COL_S}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#spectral-sensitivity-plot-clip)"
  />

  <!-- M錐体の曲線（緑） -->
  <path
    d={mPath}
    fill="none"
    stroke={COL_M}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#spectral-sensitivity-plot-clip)"
  />

  <!-- L錐体の曲線（赤） -->
  <path
    d={lPath}
    fill="none"
    stroke={COL_L}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#spectral-sensitivity-plot-clip)"
  />

  <!-- 曲線ラベル（暗記モード時は非表示） -->
  {#if !isAnki}
    <g font-size={FONT_SIZE_CURVE_LABEL} font-weight="bold" dominant-baseline="central">
      <text x={xAt(S_LABEL_NM)} y={yAt(S_LABEL_VALUE)} text-anchor="middle" fill={COL_S}>
        S錐体
      </text>
      <text x={xAt(M_LABEL_NM)} y={yAt(M_LABEL_VALUE)} text-anchor="end" fill={COL_M}>M錐体</text>
      <text x={xAt(L_LABEL_NM)} y={yAt(L_LABEL_VALUE)} text-anchor="start" fill={COL_L}>L錐体</text>
    </g>
  {/if}
</svg>
