<script lang="ts">
  import chroma from "chroma-js"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface LightMarker {
    name: string
    temp: number
  }

  // ===== SVG dimensions =====
  const WIDTH = 1100
  const HEIGHT = 320

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

  // ===== サイドラベルの位置 =====
  const SIDE_LABEL_X_GAP = 18

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"

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
    { name: "地平線の太陽光", temp: 1580 },
    { name: "天頂の太陽光", temp: 5250 },
    { name: "日中の北窓の光", temp: 6500 },
    { name: "晴天の青空", temp: 12000 }
  ]

  // ===== 主要な蛍光ランプ（帯の下） =====
  const fluorescentLamps: LightMarker[] = [
    { name: "電球色", temp: 3000 },
    { name: "白色", temp: 4000 },
    { name: "昼白色", temp: 5000 },
    { name: "昼光色", temp: 6500 }
  ]

  // ===== ラベルのY位置 =====
  // 帯の上：（外側）色温度 → 名前（内側）
  const TOP_NAME_Y = STRIP_Y - TICK_LENGTH - GAP_TICK_TO_LABEL - LINE_HEIGHT_LABEL / 2
  const TOP_TEMP_Y = TOP_NAME_Y - LINE_HEIGHT_LABEL
  // 帯の下：（内側）名前 → 色温度（外側）
  const BOTTOM_NAME_Y =
    STRIP_Y + STRIP_HEIGHT + TICK_LENGTH + GAP_TICK_TO_LABEL + LINE_HEIGHT_LABEL / 2
  const BOTTOM_TEMP_Y = BOTTOM_NAME_Y + LINE_HEIGHT_LABEL

  // ===== サイドラベルのY位置（2行） =====
  const SIDE_LABEL_CENTER_Y = STRIP_Y + STRIP_HEIGHT / 2
  const SIDE_LABEL_LINE1_Y = SIDE_LABEL_CENTER_Y - LINE_HEIGHT_LABEL / 2
  const SIDE_LABEL_LINE2_Y = SIDE_LABEL_CENTER_Y + LINE_HEIGHT_LABEL / 2

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="color-temperature-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- 帯（色温度のグラデーション） -->
  <rect
    x={STRIP_LEFT}
    y={STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#color-temperature-gradient)"
  />

  <!-- 左側ラベル：色温度が / 低い -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="end"
    dominant-baseline="central"
  >
    <text x={STRIP_LEFT - SIDE_LABEL_X_GAP} y={SIDE_LABEL_LINE1_Y}>色温度が</text>
    <text x={STRIP_LEFT - SIDE_LABEL_X_GAP} y={SIDE_LABEL_LINE2_Y}>
      {isAnki ? "" : "低い"}
    </text>
  </g>

  <!-- 右側ラベル：色温度が / 高い -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="start"
    dominant-baseline="central"
  >
    <text x={STRIP_RIGHT + SIDE_LABEL_X_GAP} y={SIDE_LABEL_LINE1_Y}>色温度が</text>
    <text x={STRIP_RIGHT + SIDE_LABEL_X_GAP} y={SIDE_LABEL_LINE2_Y}>
      {isAnki ? "" : "高い"}
    </text>
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
      <line
        x1={x}
        y1={STRIP_Y}
        x2={x}
        y2={STRIP_Y - TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      <text x={x} y={TOP_NAME_Y}>{item.name}</text>
      <text x={x} y={TOP_TEMP_Y}>{isAnki ? "" : item.temp}K</text>
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
      <text x={x} y={BOTTOM_NAME_Y}>{item.name}</text>
      <text x={x} y={BOTTOM_TEMP_Y}>{isAnki ? "" : item.temp}K</text>
    {/each}
  </g>
</svg>
