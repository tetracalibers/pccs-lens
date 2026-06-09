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
  // XYZ等色関数は負の値をとらないため、縦軸は 0 始まり。
  // z̄ が 445nm 付近で約 1.77 まで立ち上がるため上限は 1.8 とする。
  const NM_MIN = 380
  const NM_MAX = 700
  const VALUE_MIN = 0
  const VALUE_MAX = 1.8

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 50
  const X_LABELED_TICKS = [400, 500, 600, 700]
  const Y_LABELED_TICKS = [0, 0.5, 1.0, 1.5]

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
  const STROKE_WIDTH_CURVE = 3

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  // x̄・ȳ・z̄ はそれぞれ赤・緑・青の感覚に対応づけて描き分ける
  const COL_X = "var(--canvas-pen-red)"
  const COL_Y = "var(--canvas-pen-green)"
  const COL_Z = "var(--canvas-pen-blue)"

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
  const ID = "cie-xyz-cmf"

  // ===== CIE 1931 XYZ 等色関数（10nm 刻み, 2°視野標準観測者） =====
  // 仮想的な原刺激 [X], [Y], [Z] により、すべての値が非負になるのが特徴。
  const xBar: CMFPoint[] = [
    { nm: 380, value: 0.00137 },
    { nm: 390, value: 0.00424 },
    { nm: 400, value: 0.01431 },
    { nm: 410, value: 0.04351 },
    { nm: 420, value: 0.13438 },
    { nm: 430, value: 0.2839 },
    { nm: 440, value: 0.34828 },
    { nm: 450, value: 0.3362 },
    { nm: 460, value: 0.2908 },
    { nm: 470, value: 0.19536 },
    { nm: 480, value: 0.09564 },
    { nm: 490, value: 0.03201 },
    { nm: 500, value: 0.0049 },
    { nm: 510, value: 0.0093 },
    { nm: 520, value: 0.06327 },
    { nm: 530, value: 0.1655 },
    { nm: 540, value: 0.2904 },
    { nm: 550, value: 0.43345 },
    { nm: 560, value: 0.5945 },
    { nm: 570, value: 0.7621 },
    { nm: 580, value: 0.9163 },
    { nm: 590, value: 1.0263 },
    { nm: 600, value: 1.0622 },
    { nm: 610, value: 1.0026 },
    { nm: 620, value: 0.85445 },
    { nm: 630, value: 0.6424 },
    { nm: 640, value: 0.4479 },
    { nm: 650, value: 0.2835 },
    { nm: 660, value: 0.1649 },
    { nm: 670, value: 0.0874 },
    { nm: 680, value: 0.04677 },
    { nm: 690, value: 0.0227 },
    { nm: 700, value: 0.01136 }
  ]

  const yBar: CMFPoint[] = [
    { nm: 380, value: 0.00004 },
    { nm: 390, value: 0.00012 },
    { nm: 400, value: 0.0004 },
    { nm: 410, value: 0.00121 },
    { nm: 420, value: 0.004 },
    { nm: 430, value: 0.0116 },
    { nm: 440, value: 0.023 },
    { nm: 450, value: 0.038 },
    { nm: 460, value: 0.06 },
    { nm: 470, value: 0.09098 },
    { nm: 480, value: 0.13902 },
    { nm: 490, value: 0.20802 },
    { nm: 500, value: 0.323 },
    { nm: 510, value: 0.503 },
    { nm: 520, value: 0.71 },
    { nm: 530, value: 0.862 },
    { nm: 540, value: 0.954 },
    { nm: 550, value: 0.99495 },
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
    { nm: 670, value: 0.032 },
    { nm: 680, value: 0.017 },
    { nm: 690, value: 0.00821 },
    { nm: 700, value: 0.0041 }
  ]

  const zBar: CMFPoint[] = [
    { nm: 380, value: 0.00645 },
    { nm: 390, value: 0.02005 },
    { nm: 400, value: 0.06785 },
    { nm: 410, value: 0.2074 },
    { nm: 420, value: 0.6456 },
    { nm: 430, value: 1.3856 },
    { nm: 440, value: 1.74706 },
    { nm: 450, value: 1.77211 },
    { nm: 460, value: 1.6692 },
    { nm: 470, value: 1.28764 },
    { nm: 480, value: 0.81295 },
    { nm: 490, value: 0.46518 },
    { nm: 500, value: 0.272 },
    { nm: 510, value: 0.1582 },
    { nm: 520, value: 0.07825 },
    { nm: 530, value: 0.04216 },
    { nm: 540, value: 0.0203 },
    { nm: 550, value: 0.00875 },
    { nm: 560, value: 0.0039 },
    { nm: 570, value: 0.0021 },
    { nm: 580, value: 0.00165 },
    { nm: 590, value: 0.0011 },
    { nm: 600, value: 0.0008 },
    { nm: 610, value: 0.00034 },
    { nm: 620, value: 0.00019 },
    { nm: 630, value: 0.00005 },
    { nm: 640, value: 0.00002 },
    { nm: 650, value: 0 },
    { nm: 660, value: 0 },
    { nm: 670, value: 0 },
    { nm: 680, value: 0 },
    { nm: 690, value: 0 },
    { nm: 700, value: 0 }
  ]

  const curves = [
    { points: xBar, color: COL_X, label: "[X]を混ぜる量" },
    { points: yBar, color: COL_Y, label: "[Y]を混ぜる量" },
    { points: zBar, color: COL_Z, label: "[Z]を混ぜる量" }
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
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 6.7 // 「[X]を混ぜる量」程度の幅

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
