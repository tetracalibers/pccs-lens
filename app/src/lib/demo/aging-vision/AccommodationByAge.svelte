<script lang="ts">
  import { line, curveBasis } from "d3-shape"

  interface AccommodationPoint {
    age: number
    diopter: number
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
  const AGE_MAX = 90
  const VALUE_MIN = 0
  const VALUE_MAX = 16

  // ===== 目盛り設定 =====
  const X_TICK_INTERVAL = 10
  const Y_TICK_INTERVAL = 2

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 8
  const FONT_SIZE_TICK_LABEL = 24
  const FONT_SIZE_AXIS_LABEL = 30

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 70 // PLOT_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで

  // 数値ラベルと軸ラベルの間隔。縦軸を横軸と同じ間隔に揃えるため、
  // 横軸側の間隔（両ラベルの外縁どうしの距離）を求めて縦軸の位置を逆算する
  const AXIS_LABEL_GAP =
    X_AXIS_LABEL_OFFSET - X_TICK_LABEL_OFFSET - FONT_SIZE_TICK_LABEL / 2 - FONT_SIZE_AXIS_LABEL / 2
  const Y_TICK_LABEL_WIDTH = FONT_SIZE_TICK_LABEL * 1.2 // 「16」(数字2) のおおよその幅
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
  const COL_CURVE = "var(--canvas-pen-orange)"

  // ===== 曲線を描く年齢の範囲 =====
  // 軸は 0〜90 歳だが、実測データのある範囲だけを描く
  const CURVE_AGE_MIN = 10
  const CURVE_AGE_MAX = 80

  // ===== 年齢ごとの調節力（ディオプター） =====
  // Donders / Duane の古典的な調節力曲線に基づく代表値。
  // 40歳前後から低下が加速し（老視の始まり）、60歳以降はほぼ横ばいになる。
  // curveBasis のズレを抑えるため、5歳刻みで制御点を与えている。
  const POINTS: AccommodationPoint[] = [
    { age: 10, diopter: 14.0 },
    { age: 15, diopter: 12.7 },
    { age: 20, diopter: 11.0 },
    { age: 25, diopter: 9.5 },
    { age: 30, diopter: 8.0 },
    { age: 35, diopter: 6.8 },
    { age: 40, diopter: 5.5 },
    { age: 45, diopter: 4.0 },
    { age: 50, diopter: 2.5 },
    { age: 55, diopter: 1.6 },
    { age: 60, diopter: 1.0 },
    { age: 65, diopter: 0.7 },
    { age: 70, diopter: 0.5 },
    { age: 75, diopter: 0.4 },
    { age: 80, diopter: 0.3 }
  ]

  const curvePoints = POINTS.filter(
    ({ age }) => age >= CURVE_AGE_MIN && age <= CURVE_AGE_MAX
  )

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
  const lineGen = line<AccommodationPoint>()
    .x((d) => xAt(d.age))
    .y((d) => yAt(d.diopter))
    .curve(curveBasis)

  const curvePath = lineGen(curvePoints) ?? ""
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="accommodation-plot-clip">
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

  <!-- 縦軸ラベル「調節力 (D)」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
    writing-mode="vertical-rl"
  >
    調節力 (D)
  </text>

  <!-- 調節力曲線 -->
  <path
    d={curvePath}
    fill="none"
    stroke={COL_CURVE}
    stroke-width={STROKE_WIDTH_CURVE}
    stroke-linejoin="round"
    stroke-linecap="round"
    clip-path="url(#accommodation-plot-clip)"
  />
</svg>
