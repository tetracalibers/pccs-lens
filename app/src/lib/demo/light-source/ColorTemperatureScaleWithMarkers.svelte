<script lang="ts">
  import chroma from "chroma-js"

  interface LightMarker {
    temp: number
    name?: string
  }

  interface Props {
    markers: LightMarker[]
  }

  let { markers }: Props = $props()

  // ===== Strip layout =====
  const STRIP_WIDTH = 800
  const STRIP_HEIGHT = 64

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

  // ===== 外側パディング =====
  const PADDING_VERTICAL = 8
  const PADDING_HORIZONTAL = 4

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"

  // ===== グラデーションストップ生成 =====
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return {
      offset: t,
      color: chroma.temperature(temp).hex()
    }
  })

  const hasNames = $derived(markers.some((m) => m.name != null && m.name !== ""))
  const nameLineCount = $derived(hasNames ? 1 : 0)

  // ===== SVG の大きさ・帯の位置（他の値から自動算出） =====
  // 帯下：tick + ラベル隙間 + 色温度ラベル中心 + 名前ラベル積み + 最下段の下半分
  const stackExtent = $derived(
    TICK_LENGTH +
      GAP_TICK_TO_LABEL +
      LINE_HEIGHT_LABEL / 2 +
      LINE_HEIGHT_LABEL * nameLineCount +
      LINE_HEIGHT_LABEL / 2
  )

  const STRIP_Y = PADDING_VERTICAL
  const HEIGHT = $derived(STRIP_Y + STRIP_HEIGHT + stackExtent + PADDING_VERTICAL)

  // 横：各マーカーラベルが帯端からはみ出す量を集計
  const estimateCharWidth = (ch: string, fontSize: number): number => {
    const code = ch.charCodeAt(0)
    const isFullWidth = (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)
    return isFullWidth ? fontSize : fontSize * 0.6
  }
  const estimateTextWidth = (s: string, fontSize: number): number =>
    [...s].reduce((sum, ch) => sum + estimateCharWidth(ch, fontSize), 0)

  const markerLabelHalfWidth = (m: LightMarker): number => {
    const texts = [`${m.temp}K`]
    if (m.name) texts.push(m.name)
    return Math.max(...texts.map((t) => estimateTextWidth(t, FONT_SIZE_MARKER_LABEL))) / 2
  }
  const markerRelativeX = (temp: number): number =>
    ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  const LEFT_OVERHANG = $derived(
    markers.length === 0
      ? 0
      : Math.max(0, ...markers.map((m) => markerLabelHalfWidth(m) - markerRelativeX(m.temp)))
  )
  const RIGHT_OVERHANG = $derived(
    markers.length === 0
      ? 0
      : Math.max(
          0,
          ...markers.map((m) => markerLabelHalfWidth(m) + markerRelativeX(m.temp) - STRIP_WIDTH)
        )
  )

  const STRIP_LEFT = $derived(LEFT_OVERHANG + PADDING_HORIZONTAL)
  const STRIP_RIGHT = $derived(STRIP_LEFT + STRIP_WIDTH)
  const WIDTH = $derived(STRIP_RIGHT + RIGHT_OVERHANG + PADDING_HORIZONTAL)

  // ===== 色温度 → X座標 =====
  const xAt = (temp: number): number =>
    STRIP_LEFT + ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  // ===== ラベルのY位置 =====
  // 帯下：（内側、帯寄り）色温度 → 名前（外側）
  const TEMP_Y = STRIP_Y + STRIP_HEIGHT + TICK_LENGTH + GAP_TICK_TO_LABEL + LINE_HEIGHT_LABEL / 2

  const gradientId = `color-temperature-gradient-marked-${Math.random().toString(36).slice(2, 10)}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
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
    fill="url(#{gradientId})"
  />

  <!-- マーカー（帯の下） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_MARKER_LABEL}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each markers as marker (marker.temp)}
      {@const x = xAt(marker.temp)}
      <line
        x1={x}
        y1={STRIP_Y + STRIP_HEIGHT}
        x2={x}
        y2={STRIP_Y + STRIP_HEIGHT + TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      <text {x} y={TEMP_Y}>
        <tspan>{marker.temp}</tspan>
        <tspan dx="-0.4em">K</tspan>
      </text>
      {#if marker.name}
        <text {x} y={TEMP_Y + LINE_HEIGHT_LABEL}>{marker.name}</text>
      {/if}
    {/each}
  </g>
</svg>
