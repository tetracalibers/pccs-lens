<script lang="ts">
  import { line, curveBasis } from "d3-shape"

  interface CMFPoint {
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
  // 凡例（高さ 108）をプロット上部の外側に置くための余白を確保する
  const PLOT_TOP = 140
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

  // ===== 軸の範囲 =====
  const NM_MIN = 380
  const NM_MAX = 700
  const VALUE_MIN = -0.1
  const VALUE_MAX = 0.4

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const X_LABELED_TICKS = [400, 500, 600, 700]
  const Y_LABELED_TICKS = [-0.1, 0, 0.1, 0.2, 0.3, 0.4]

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 26
  const FONT_SIZE_LEGEND = 22

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // X_AXIS_VISUAL_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // X_AXIS_VISUAL_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 100 // PLOT_LEFT から軸ラベル中心まで

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5
  const STROKE_WIDTH_ZERO = 1.5
  const STROKE_WIDTH_CURVE = 3

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_ZERO = "var(--color-body)"
  const COL_R = "var(--canvas-pen-red)"
  const COL_G = "var(--canvas-pen-green)"
  const COL_B = "var(--canvas-pen-blue)"
  // マイナスの混色量の領域（横軸より下）を示す帯
  const COL_NEGATIVE_BAND = "var(--color-body)"
  const OPACITY_NEGATIVE_BAND = 0.06

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
  const ID = "cie-rgb-cmf"

  // ===== CIE 1931 RGB 等色関数（10nm 刻み, Wright–Guild ベース） =====
  // 原刺激 [R]=700.0nm, [G]=546.1nm, [B]=435.8nm
  // r̄ は 440〜545nm 付近でマイナス（負の混色量）になるのが特徴。
  const rBar: CMFPoint[] = [
    { nm: 380, value: 0.00003 },
    { nm: 390, value: 0.0001 },
    { nm: 400, value: 0.0003 },
    { nm: 410, value: 0.00084 },
    { nm: 420, value: 0.00211 },
    { nm: 430, value: 0.00218 },
    { nm: 440, value: -0.00261 },
    { nm: 450, value: -0.01213 },
    { nm: 460, value: -0.02608 },
    { nm: 470, value: -0.03933 },
    { nm: 480, value: -0.04939 },
    { nm: 490, value: -0.05814 },
    { nm: 500, value: -0.07173 },
    { nm: 510, value: -0.08901 },
    { nm: 520, value: -0.09264 },
    { nm: 530, value: -0.07101 },
    { nm: 540, value: -0.03152 },
    { nm: 550, value: 0.02279 },
    { nm: 560, value: 0.0906 },
    { nm: 570, value: 0.16768 },
    { nm: 580, value: 0.24526 },
    { nm: 590, value: 0.30928 },
    { nm: 600, value: 0.34429 },
    { nm: 610, value: 0.33971 },
    { nm: 620, value: 0.29708 },
    { nm: 630, value: 0.22677 },
    { nm: 640, value: 0.15968 },
    { nm: 650, value: 0.10167 },
    { nm: 660, value: 0.05932 },
    { nm: 670, value: 0.03149 },
    { nm: 680, value: 0.01687 },
    { nm: 690, value: 0.00819 },
    { nm: 700, value: 0.0041 }
  ]

  const gBar: CMFPoint[] = [
    { nm: 380, value: -0.00001 },
    { nm: 390, value: -0.00004 },
    { nm: 400, value: -0.00014 },
    { nm: 410, value: -0.00041 },
    { nm: 420, value: -0.0011 },
    { nm: 430, value: -0.00119 },
    { nm: 440, value: 0.00149 },
    { nm: 450, value: 0.00678 },
    { nm: 460, value: 0.01485 },
    { nm: 470, value: 0.02538 },
    { nm: 480, value: 0.03914 },
    { nm: 490, value: 0.05689 },
    { nm: 500, value: 0.08536 },
    { nm: 510, value: 0.1286 },
    { nm: 520, value: 0.17468 },
    { nm: 530, value: 0.20317 },
    { nm: 540, value: 0.21466 },
    { nm: 550, value: 0.21178 },
    { nm: 560, value: 0.19702 },
    { nm: 570, value: 0.17087 },
    { nm: 580, value: 0.1361 },
    { nm: 590, value: 0.09754 },
    { nm: 600, value: 0.06246 },
    { nm: 610, value: 0.03557 },
    { nm: 620, value: 0.01828 },
    { nm: 630, value: 0.00833 },
    { nm: 640, value: 0.00334 },
    { nm: 650, value: 0.00116 },
    { nm: 660, value: 0.00037 },
    { nm: 670, value: 0.00011 },
    { nm: 680, value: 0.00003 },
    { nm: 690, value: 0 },
    { nm: 700, value: 0 }
  ]

  const bBar: CMFPoint[] = [
    { nm: 380, value: 0.00117 },
    { nm: 390, value: 0.00359 },
    { nm: 400, value: 0.01214 },
    { nm: 410, value: 0.03707 },
    { nm: 420, value: 0.11541 },
    { nm: 430, value: 0.24769 },
    { nm: 440, value: 0.31228 },
    { nm: 450, value: 0.3167 },
    { nm: 460, value: 0.29821 },
    { nm: 470, value: 0.22991 },
    { nm: 480, value: 0.14494 },
    { nm: 490, value: 0.08257 },
    { nm: 500, value: 0.04776 },
    { nm: 510, value: 0.02698 },
    { nm: 520, value: 0.01221 },
    { nm: 530, value: 0.00549 },
    { nm: 540, value: 0.00146 },
    { nm: 550, value: -0.00058 },
    { nm: 560, value: -0.0013 },
    { nm: 570, value: -0.00135 },
    { nm: 580, value: -0.00108 },
    { nm: 590, value: -0.00079 },
    { nm: 600, value: -0.00049 },
    { nm: 610, value: -0.0003 },
    { nm: 620, value: -0.00018 },
    { nm: 630, value: -0.00011 },
    { nm: 640, value: -0.00006 },
    { nm: 650, value: -0.00003 },
    { nm: 660, value: -0.00001 },
    { nm: 670, value: -0.00001 },
    { nm: 680, value: 0 },
    { nm: 690, value: 0 },
    { nm: 700, value: 0 }
  ]

  const curves = [
    { points: rBar, color: COL_R, label: "[R]を混ぜる量" },
    { points: gBar, color: COL_G, label: "[G]を混ぜる量" },
    { points: bBar, color: COL_B, label: "[B]を混ぜる量" }
  ]

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
  const lineGen = line<CMFPoint>()
    .x((d) => xAt(d.nm))
    .y((d) => yAt(d.value))
    .curve(curveBasis)

  // ===== 凡例（プロット内・右上） =====
  const LEGEND_LINE_LENGTH = 48
  const LEGEND_ROW_GAP = 32
  const LEGEND_LABEL_GAP = 14
  const LEGEND_MARGIN = 16 // プロット枠と凡例枠の間の余白
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 6.7 // 「[R]を混ぜる量」程度の幅

  // 凡例の枠線
  const LEGEND_FRAME_PADDING_X = 18
  const LEGEND_FRAME_PADDING_Y = 22
  const LEGEND_FRAME_RADIUS = 6
  const STROKE_WIDTH_LEGEND_FRAME = 1
  const LEGEND_CONTENT_WIDTH = LEGEND_LINE_LENGTH + LEGEND_LABEL_GAP + LEGEND_TEXT_WIDTH
  const LEGEND_FRAME_WIDTH = LEGEND_CONTENT_WIDTH + 2 * LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_HEIGHT = LEGEND_ROW_GAP * (curves.length - 1) + 2 * LEGEND_FRAME_PADDING_Y

  // 枠の位置（プロット上部の外側・右寄せ。曲線と重ならないよう上にずらす）
  const LEGEND_FRAME_X = PLOT_RIGHT - LEGEND_FRAME_WIDTH - LEGEND_MARGIN
  const LEGEND_FRAME_Y = LEGEND_MARGIN
  const LEGEND_FRAME_CENTER_X = LEGEND_FRAME_X + LEGEND_FRAME_WIDTH / 2

  // 内側コンテンツの位置（枠の水平中央に揃える）
  const LEGEND_LINE_X1 = LEGEND_FRAME_CENTER_X - LEGEND_CONTENT_WIDTH / 2
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_LABEL_CENTER_X = LEGEND_LABEL_X + LEGEND_TEXT_WIDTH / 2
  const legendRowY = (i: number): number =>
    LEGEND_FRAME_Y + LEGEND_FRAME_PADDING_Y + i * LEGEND_ROW_GAP
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

  <!-- マイナスの混色量の領域（横軸＝0 より下）を示す帯 -->
  <rect
    x={PLOT_LEFT}
    y={yAt(0)}
    width={PLOT_WIDTH}
    height={PLOT_BOTTOM - yAt(0)}
    fill={COL_NEGATIVE_BAND}
    opacity={OPACITY_NEGATIVE_BAND}
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

  <!-- 横軸（プロット下端） -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_BOTTOM}
    x2={PLOT_RIGHT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 値が 0 の基準線（この線より下が負の混色量） -->
  <line
    x1={PLOT_LEFT}
    y1={yAt(0)}
    x2={PLOT_RIGHT}
    y2={yAt(0)}
    stroke={COL_ZERO}
    stroke-width={STROKE_WIDTH_ZERO}
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

  <!-- 等色関数の曲線 -->
  <g clip-path="url(#plot-clip-{ID})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    {#each curves as curve (curve.label)}
      <path
        d={lineGen(curve.points) ?? ""}
        stroke={curve.color}
        stroke-width={STROKE_WIDTH_CURVE}
      />
    {/each}
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

  <!-- 縦軸ラベル「三刺激値（混色量）」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    三刺激値（混色量）
  </text>

  <!-- 凡例（プロット内・上部中央） -->
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
    {#each curves as curve, i (curve.label)}
      <line
        x1={LEGEND_LINE_X1}
        y1={legendRowY(i)}
        x2={LEGEND_LINE_X2}
        y2={legendRowY(i)}
        stroke={curve.color}
        stroke-width={STROKE_WIDTH_CURVE}
        stroke-linecap="round"
      />
      <text
        x={LEGEND_LABEL_CENTER_X}
        y={legendRowY(i)}
        text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--font-math-base), var(--font-ja-base)"
        font-size={FONT_SIZE_LEGEND}
        fill={COL_LABEL}
      >
        {curve.label}
      </text>
    {/each}
  </g>
</svg>
