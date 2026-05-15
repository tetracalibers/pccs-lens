<script lang="ts">
  import chroma from "chroma-js"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface NamePart {
    text: string
    ankiHide?: boolean // true なら暗記モードで非表示（スペースは保持）
  }

  interface LightMarker {
    nameLines: NamePart[][] // 行 × 各行のセグメント
    temp: number
  }

  // ===== SVG dimensions =====
  const WIDTH = 1100
  const HEIGHT = 380

  // ===== Strip layout =====
  const STRIP_LEFT = 150
  const STRIP_RIGHT = 950
  const STRIP_WIDTH = STRIP_RIGHT - STRIP_LEFT
  const STRIP_HEIGHT = 64
  const STRIP_Y = (HEIGHT - STRIP_HEIGHT) / 2

  // ===== 色温度の範囲 =====
  const TEMP_MIN = 1500
  const TEMP_MAX = 12500

  // ===== グラデーション =====
  const GRADIENT_SAMPLE_COUNT = 23 // 1500K → 12500K を 500K 刻みでサンプル

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 12
  const STROKE_WIDTH_TICK = 1.5
  const GAP_TICK_TO_LABEL = 6
  const LINE_HEIGHT_LABEL = 28
  const FONT_SIZE_MARKER_LABEL = 18
  const FONT_SIZE_SIDE_LABEL = 22
  const FONT_SIZE_GROUP_TITLE = 24
  const GROUP_TITLE_GAP = 52 // 直近ラベル中心からタイトル中心までの距離

  // ===== 矢の形状（タイプA） =====
  const STROKE_WIDTH_ARROW = 2
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 20
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_ARROW * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== サイドラベルの位置 =====
  const SIDE_LABEL_X_GAP = 18

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"
  // サイドラベル（低/高）は帯の両端の色を使う
  const COL_LOW_END = chroma.temperature(TEMP_MIN).hex()
  const COL_HIGH_END = chroma.temperature(TEMP_MAX).hex()

  // ===== 色温度 → X座標 =====
  const xAt = (temp: number): number =>
    STRIP_LEFT + ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  // ===== グラデーションストップ生成 =====
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return {
      offset: t,
      color: chroma.temperature(temp).hex()
    }
  })

  // ===== 主要な自然光（帯の上） =====
  const naturalLights: LightMarker[] = [
    { nameLines: [[{ text: "地平線の" }], [{ text: "太陽光" }]], temp: 1580 },
    { nameLines: [[{ text: "天頂の" }], [{ text: "太陽光" }]], temp: 5250 },
    { nameLines: [[{ text: "日中の" }], [{ text: "北窓の光" }]], temp: 6500 },
    { nameLines: [[{ text: "晴天の" }], [{ text: "青空" }]], temp: 12000 }
  ]

  // ===== 主要な蛍光ランプ（帯の下） =====
  // 「色」以外の部分を暗記モードで非表示にする
  const fluorescentLamps: LightMarker[] = [
    { nameLines: [[{ text: "電球", ankiHide: true }, { text: "色" }]], temp: 3000 },
    { nameLines: [[{ text: "白", ankiHide: true }, { text: "色" }]], temp: 4000 },
    { nameLines: [[{ text: "昼白", ankiHide: true }, { text: "色" }]], temp: 5000 },
    { nameLines: [[{ text: "昼光", ankiHide: true }, { text: "色" }]], temp: 6500 }
  ]

  // ===== ラベルのY位置 =====
  // 帯の上：（外側）名前 → 色温度（内側、帯寄り）
  // 名前が複数行の場合、temp に近い行から順に積み上げる
  const TOP_TEMP_Y = STRIP_Y - TICK_LENGTH - GAP_TICK_TO_LABEL - LINE_HEIGHT_LABEL / 2
  // 帯の下：（内側、帯寄り）色温度 → 名前（外側）
  const BOTTOM_TEMP_Y =
    STRIP_Y + STRIP_HEIGHT + TICK_LENGTH + GAP_TICK_TO_LABEL + LINE_HEIGHT_LABEL / 2

  // ===== セクションタイトル位置 =====
  const maxTopNameLines = Math.max(...naturalLights.map((l) => l.nameLines.length))
  const maxBottomNameLines = Math.max(...fluorescentLamps.map((l) => l.nameLines.length))
  const TOP_TITLE_Y = TOP_TEMP_Y - LINE_HEIGHT_LABEL * maxTopNameLines - GROUP_TITLE_GAP
  const BOTTOM_TITLE_Y = BOTTOM_TEMP_Y + LINE_HEIGHT_LABEL * maxBottomNameLines + GROUP_TITLE_GAP

  // ===== セクション矢印（タイトルと最上段/最下段ラベルの中間に配置） =====
  const TOP_TOPMOST_LABEL_Y = TOP_TEMP_Y - LINE_HEIGHT_LABEL * maxTopNameLines
  const BOTTOM_BOTTOMMOST_LABEL_Y = BOTTOM_TEMP_Y + LINE_HEIGHT_LABEL * maxBottomNameLines
  const TOP_ARROW_Y = (TOP_TITLE_Y + TOP_TOPMOST_LABEL_Y) / 2
  const BOTTOM_ARROW_Y = (BOTTOM_TITLE_Y + BOTTOM_BOTTOMMOST_LABEL_Y) / 2

  const naturalArrowStartX = xAt(naturalLights[0].temp)
  const naturalArrowEndX = xAt(naturalLights[naturalLights.length - 1].temp)
  const fluorescentArrowStartX = xAt(fluorescentLamps[0].temp)
  const fluorescentArrowEndX = xAt(fluorescentLamps[fluorescentLamps.length - 1].temp)

  // タイトルのX位置は各矢印の中央
  const TOP_TITLE_X = (naturalArrowStartX + naturalArrowEndX) / 2
  const BOTTOM_TITLE_X = (fluorescentArrowStartX + fluorescentArrowEndX) / 2

  // ===== サイドラベルのY位置 =====
  const SIDE_LABEL_CENTER_Y = STRIP_Y + STRIP_HEIGHT / 2

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="color-temperature-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
    <marker
      id="arrow-section"
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
        stroke={COL_BODY}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 帯（色温度のグラデーション） -->
  <rect
    x={STRIP_LEFT}
    y={STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#color-temperature-gradient)"
  />

  <!-- 左側ラベル：低（帯の左端の色） -->
  <text
    x={STRIP_LEFT - SIDE_LABEL_X_GAP}
    y={SIDE_LABEL_CENTER_Y}
    fill={COL_LOW_END}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="end"
    dominant-baseline="central"
  >
    {isAnki ? "" : "低"}
  </text>

  <!-- 右側ラベル：高（帯の右端の色） -->
  <text
    x={STRIP_RIGHT + SIDE_LABEL_X_GAP}
    y={SIDE_LABEL_CENTER_Y}
    fill={COL_HIGH_END}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="start"
    dominant-baseline="central"
  >
    {isAnki ? "" : "高"}
  </text>

  <!-- セクションタイトル -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_GROUP_TITLE}
    font-weight="bold"
    text-anchor="middle"
    dominant-baseline="central"
  >
    <text x={TOP_TITLE_X} y={TOP_TITLE_Y}>自然光</text>
    <text x={BOTTOM_TITLE_X} y={BOTTOM_TITLE_Y}>蛍光ランプ</text>
  </g>

  <!-- セクション矢印（最初と最後の目盛りを結ぶ） -->
  <g stroke={COL_BODY} stroke-width={STROKE_WIDTH_ARROW} fill="none">
    <line
      x1={naturalArrowStartX}
      y1={TOP_ARROW_Y}
      x2={naturalArrowEndX}
      y2={TOP_ARROW_Y}
      marker-start="url(#arrow-section)"
      marker-end="url(#arrow-section)"
    />
    <line
      x1={fluorescentArrowStartX}
      y1={BOTTOM_ARROW_Y}
      x2={fluorescentArrowEndX}
      y2={BOTTOM_ARROW_Y}
      marker-start="url(#arrow-section)"
      marker-end="url(#arrow-section)"
    />
  </g>

  <!-- 自然光（帯の上） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_MARKER_LABEL}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each naturalLights as item (item.temp)}
      {@const x = xAt(item.temp)}
      {@const lineCount = item.nameLines.length}
      <line
        x1={x}
        y1={STRIP_Y}
        x2={x}
        y2={STRIP_Y - TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      {#each item.nameLines as line, i (i)}
        <text {x} y={TOP_TEMP_Y - LINE_HEIGHT_LABEL * (lineCount - i)}>
          {#each line as part, j (j)}<tspan
              visibility={part.ankiHide && isAnki ? "hidden" : "visible"}>{part.text}</tspan>{/each}
        </text>
      {/each}
      <text {x} y={TOP_TEMP_Y}>
        <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>K
      </text>
    {/each}
  </g>

  <!-- 蛍光ランプ（帯の下） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_MARKER_LABEL}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each fluorescentLamps as item (item.temp)}
      {@const x = xAt(item.temp)}
      <line
        x1={x}
        y1={STRIP_Y + STRIP_HEIGHT}
        x2={x}
        y2={STRIP_Y + STRIP_HEIGHT + TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      <text {x} y={BOTTOM_TEMP_Y}>
        <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>K
      </text>
      {#each item.nameLines as line, i (i)}
        <text {x} y={BOTTOM_TEMP_Y + LINE_HEIGHT_LABEL * (i + 1)}>
          {#each line as part, j (j)}<tspan
              visibility={part.ankiHide && isAnki ? "hidden" : "visible"}>{part.text}</tspan>{/each}
        </text>
      {/each}
    {/each}
  </g>
</svg>
