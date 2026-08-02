<script lang="ts">
  import { line, curveBasis } from "d3-shape"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface PupilPoint {
    age: number
    diameter: number
  }

  // ===== SVG dimensions =====
  const PLOT_WIDTH = 720
  const PLOT_HEIGHT = 360
  const PLOT_LEFT = 120
  const PLOT_TOP = 30
  const MARGIN_RIGHT = 30
  const MARGIN_BOTTOM = 100
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 軸の範囲 =====
  const AGE_MIN = 0
  const AGE_MAX = 70
  const VALUE_MIN = 2
  const VALUE_MAX = 8

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 10
  const Y_TICK_INTERVAL = 1

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
  const Y_TICK_LABEL_WIDTH = FONT_SIZE_TICK_LABEL * 0.6 // 「8」(数字1) のおおよその幅
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
  const COL_LIGHT_ADAPTED = "var(--canvas-pen-orange)" // 明順応
  const COL_DARK_ADAPTED = "var(--canvas-pen-blue)" // 暗順応

  // ===== 凡例（プロット内右上） =====
  const LEGEND_LINE_LENGTH = 56
  const LEGEND_ROW_GAP = 32
  const LEGEND_LABEL_GAP = 14
  const LEGEND_TEXT_WIDTH = FONT_SIZE_LEGEND * 3.0 // 「明順応」「暗順応」(3 全角文字) のおおよその幅

  // 凡例の枠線
  const LEGEND_FRAME_PADDING_X = 18
  const LEGEND_FRAME_PADDING_Y = 22
  const LEGEND_FRAME_RADIUS = 6
  const STROKE_WIDTH_LEGEND_FRAME = 1
  const LEGEND_CONTENT_WIDTH = LEGEND_LINE_LENGTH + LEGEND_LABEL_GAP + LEGEND_TEXT_WIDTH
  const LEGEND_FRAME_WIDTH = LEGEND_CONTENT_WIDTH + 2 * LEGEND_FRAME_PADDING_X
  const LEGEND_FRAME_HEIGHT = LEGEND_ROW_GAP + 2 * LEGEND_FRAME_PADDING_Y

  // 枠の位置（プロット右上からの余白で指定）
  const LEGEND_FRAME_MARGIN_RIGHT = 24
  const LEGEND_FRAME_MARGIN_TOP = 20
  const LEGEND_FRAME_X = PLOT_RIGHT - LEGEND_FRAME_MARGIN_RIGHT - LEGEND_FRAME_WIDTH
  const LEGEND_FRAME_Y = PLOT_TOP + LEGEND_FRAME_MARGIN_TOP
  const LEGEND_FRAME_CENTER_X = LEGEND_FRAME_X + LEGEND_FRAME_WIDTH / 2

  // 内側コンテンツの位置（枠の水平中央に揃える）
  const LEGEND_LINE_X1 = LEGEND_FRAME_CENTER_X - LEGEND_CONTENT_WIDTH / 2
  const LEGEND_LINE_X2 = LEGEND_LINE_X1 + LEGEND_LINE_LENGTH
  const LEGEND_LABEL_X = LEGEND_LINE_X2 + LEGEND_LABEL_GAP
  const LEGEND_LABEL_CENTER_X = LEGEND_LABEL_X + LEGEND_TEXT_WIDTH / 2
  const LEGEND_Y_LIGHT = LEGEND_FRAME_Y + LEGEND_FRAME_PADDING_Y
  const LEGEND_Y_DARK = LEGEND_Y_LIGHT + LEGEND_ROW_GAP

  // ===== 曲線を描く年齢の範囲 =====
  // 軸は 0〜70 歳だが、実測データのある範囲だけを描く
  const CURVE_AGE_MIN = 10
  const CURVE_AGE_MAX = 70

  // ===== 年齢ごとの瞳孔径（mm） =====
  // Birren / Loewenfeld らの古典的な加齢データに基づく代表値。
  // 明順応時（明所）の瞳孔径は加齢による変化が小さく、
  // 暗順応時（暗所）の瞳孔径は 10 歳代のピークから加齢とともに縮小していく（老人性縮瞳）。
  // curveBasis のズレを抑えるため、5歳刻みで制御点を与えている。
  const LIGHT_ADAPTED_POINTS: PupilPoint[] = [
    { age: 10, diameter: 4.3 },
    { age: 15, diameter: 4.3 },
    { age: 20, diameter: 4.2 },
    { age: 25, diameter: 4.1 },
    { age: 30, diameter: 4.0 },
    { age: 35, diameter: 4.0 },
    { age: 40, diameter: 3.9 },
    { age: 45, diameter: 3.8 },
    { age: 50, diameter: 3.8 },
    { age: 55, diameter: 3.7 },
    { age: 60, diameter: 3.6 },
    { age: 65, diameter: 3.6 },
    { age: 70, diameter: 3.5 }
  ]
  const DARK_ADAPTED_POINTS: PupilPoint[] = [
    { age: 10, diameter: 7.4 },
    { age: 15, diameter: 7.5 },
    { age: 20, diameter: 7.4 },
    { age: 25, diameter: 7.2 },
    { age: 30, diameter: 7.0 },
    { age: 35, diameter: 6.8 },
    { age: 40, diameter: 6.5 },
    { age: 45, diameter: 6.2 },
    { age: 50, diameter: 5.9 },
    { age: 55, diameter: 5.6 },
    { age: 60, diameter: 5.3 },
    { age: 65, diameter: 5.1 },
    { age: 70, diameter: 4.9 }
  ]

  const inCurveRange = ({ age }: PupilPoint): boolean =>
    age >= CURVE_AGE_MIN && age <= CURVE_AGE_MAX

  // ===== 座標変換 =====
  const xAt = (age: number): number =>
    PLOT_LEFT + ((age - AGE_MIN) / (AGE_MAX - AGE_MIN)) * PLOT_WIDTH
  const yAt = (value: number): number =>
    PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * PLOT_HEIGHT

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.floor((AGE_MAX - AGE_MIN) / X_TICK_INTERVAL) + 1 },
    (_, i) => AGE_MIN + i * X_TICK_INTERVAL
  )
  const yTicks = Array.from(
    { length: Math.floor((VALUE_MAX - VALUE_MIN) / Y_TICK_INTERVAL) + 1 },
    (_, i) => VALUE_MIN + i * Y_TICK_INTERVAL
  )

  // ===== 曲線のパス生成 =====
  // curveBasis（B-spline）で C² 連続のなめらかな曲線を描画
  const lineGen = line<PupilPoint>()
    .x((d) => xAt(d.age))
    .y((d) => yAt(d.diameter))
    .curve(curveBasis)

  const lightAdaptedPath = lineGen(LIGHT_ADAPTED_POINTS.filter(inCurveRange)) ?? ""
  const darkAdaptedPath = lineGen(DARK_ADAPTED_POINTS.filter(inCurveRange)) ?? ""

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="pupil-diameter-plot-clip">
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
    {#each xTicks as age (age)}
      <line x1={xAt(age)} y1={PLOT_BOTTOM} x2={xAt(age)} y2={PLOT_BOTTOM + TICK_LENGTH} />
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
    {#each xTicks as age (age)}
      <text x={xAt(age)} y={PLOT_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {age}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「年齢 (歳)」 -->
  <text
    x={(PLOT_LEFT + PLOT_RIGHT) / 2}
    y={PLOT_BOTTOM + X_AXIS_LABEL_OFFSET}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
  >
    年齢 (歳)
  </text>

  <!-- 縦軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="end">
    {#each yTicks as v (v)}
      <text x={PLOT_LEFT - Y_TICK_LABEL_OFFSET} y={yAt(v)} dominant-baseline="central">
        {v}
      </text>
    {/each}
  </g>

  <!-- 縦軸ラベル「瞳孔径 (mm)」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    瞳孔径 (mm)
  </text>

  <!-- 暗順応時の瞳孔径（青） -->
  <path
    d={darkAdaptedPath}
    fill="none"
    stroke={COL_DARK_ADAPTED}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#pupil-diameter-plot-clip)"
  />

  <!-- 明順応時の瞳孔径（橙） -->
  <path
    d={lightAdaptedPath}
    fill="none"
    stroke={COL_LIGHT_ADAPTED}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#pupil-diameter-plot-clip)"
  />

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
      y1={LEGEND_Y_LIGHT}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_Y_LIGHT}
      stroke={COL_LIGHT_ADAPTED}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    <text
      x={LEGEND_LABEL_CENTER_X}
      y={LEGEND_Y_LIGHT}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_LEGEND}
      fill={COL_LABEL}
      visibility={isAnki ? "hidden" : "visible"}
    >
      明順応
    </text>
    <line
      x1={LEGEND_LINE_X1}
      y1={LEGEND_Y_DARK}
      x2={LEGEND_LINE_X2}
      y2={LEGEND_Y_DARK}
      stroke={COL_DARK_ADAPTED}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
    <text
      x={LEGEND_LABEL_CENTER_X}
      y={LEGEND_Y_DARK}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_LEGEND}
      fill={COL_LABEL}
      visibility={isAnki ? "hidden" : "visible"}
    >
      暗順応
    </text>
  </g>
</svg>
