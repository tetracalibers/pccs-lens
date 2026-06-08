<script lang="ts">
  interface CMFPoint {
    nm: number
    value: number
  }

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
  const FONT_SIZE_LEGEND = 26

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // PLOT_BOTTOM から軸ラベル中心まで
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
    { points: rBar, color: COL_R, label: "r̄(λ)" },
    { points: gBar, color: COL_G, label: "ḡ(λ)" },
    { points: bBar, color: COL_B, label: "b̄(λ)" }
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

  // ===== Catmull-Rom 風の滑らかなパス生成 =====
  function smoothCurveSegments(pts: CMFPoint[]): string {
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

  // ===== 凡例レイアウト =====
  const LEGEND_SWATCH_W = 40
  const LEGEND_GAP = 8 // swatch と文字の隙間
  const LEGEND_ITEM_W = 150 // 1項目の占有幅
  const LEGEND_Y = PLOT_TOP + 14
  const legendTotalW = LEGEND_ITEM_W * curves.length
  const legendStartX = (PLOT_LEFT + PLOT_RIGHT) / 2 - legendTotalW / 2
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="plot-clip-{ID}">
      <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
    </clipPath>
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

  <!-- 横軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each xTicks as nm (nm)}
      <line x1={xAt(nm)} y1={PLOT_BOTTOM} x2={xAt(nm)} y2={PLOT_BOTTOM + TICK_LENGTH} />
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
        d={smoothCurveSegments(curve.points)}
        stroke={curve.color}
        stroke-width={STROKE_WIDTH_CURVE}
      />
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

  <!-- 凡例 -->
  <g font-size={FONT_SIZE_LEGEND} font-style="italic" font-family="var(--font-math)">
    {#each curves as curve, i (curve.label)}
      {@const itemX = legendStartX + i * LEGEND_ITEM_W}
      <line
        x1={itemX}
        y1={LEGEND_Y}
        x2={itemX + LEGEND_SWATCH_W}
        y2={LEGEND_Y}
        stroke={curve.color}
        stroke-width={STROKE_WIDTH_CURVE}
        stroke-linecap="round"
      />
      <text
        x={itemX + LEGEND_SWATCH_W + LEGEND_GAP}
        y={LEGEND_Y}
        dominant-baseline="central"
        fill={curve.color}
      >
        {curve.label}
      </text>
    {/each}
  </g>
</svg>
