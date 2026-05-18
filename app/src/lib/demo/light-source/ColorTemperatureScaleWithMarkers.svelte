<script lang="ts">
  import chroma from "chroma-js"
  import LampIcon from "./LampIcon.svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Marker {
    temp: number
    label?: string
  }

  interface Props {
    markers: Marker[]
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

  // ===== Tick =====
  const TICK_LENGTH = 12
  const STROKE_WIDTH_TICK = 2

  // ===== Lamp icon =====
  const LAMP_ICON_SIZE = 56
  const GAP_TICK_TO_ICON = 6

  // ===== Label =====
  const FONT_SIZE_LABEL = 18
  const GAP_ICON_TO_LABEL = 6

  // ===== 外側パディング =====
  const PADDING_VERTICAL = 22
  const PADDING_HORIZONTAL = 22

  // ===== グラデーションストップ生成 =====
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return {
      offset: t,
      color: chroma.temperature(temp).hex()
    }
  })

  // ===== 文字幅の見積もり（全角 = フォントサイズ、半角 = フォントサイズ × 0.6） =====
  const estimateCharWidth = (ch: string, fontSize: number): number => {
    const code = ch.charCodeAt(0)
    const isFullWidth = (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)
    return isFullWidth ? fontSize : fontSize * 0.6
  }
  const estimateTextWidth = (s: string, fontSize: number): number =>
    [...s].reduce((sum, ch) => sum + estimateCharWidth(ch, fontSize), 0)

  // ===== ラベルの有無 =====
  const hasAnyLabel = $derived(markers.some((m) => m.label))

  // ===== SVG の大きさ・帯の位置（他の値から自動算出） =====
  // 帯下：tick + 隙間 + アイコン本体 +（ラベルがある場合は 隙間 + ラベル）
  const labelStackExtent = $derived(hasAnyLabel ? GAP_ICON_TO_LABEL + FONT_SIZE_LABEL : 0)
  const stackExtent = $derived(TICK_LENGTH + GAP_TICK_TO_ICON + LAMP_ICON_SIZE + labelStackExtent)

  const STRIP_Y = PADDING_VERTICAL
  const HEIGHT = $derived(STRIP_Y + STRIP_HEIGHT + stackExtent + PADDING_VERTICAL)

  // 横：各マーカー（アイコンとラベルの広い方）が帯端からはみ出す量を集計
  const markerRelativeX = (temp: number): number =>
    ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  const markerHalfWidth = (m: Marker): number => {
    const labelHalf = m.label ? estimateTextWidth(m.label, FONT_SIZE_LABEL) / 2 : 0
    return Math.max(LAMP_ICON_SIZE / 2, labelHalf)
  }

  const LEFT_OVERHANG = $derived(
    markers.length === 0
      ? 0
      : Math.max(0, ...markers.map((m) => markerHalfWidth(m) - markerRelativeX(m.temp)))
  )
  const RIGHT_OVERHANG = $derived(
    markers.length === 0
      ? 0
      : Math.max(
          0,
          ...markers.map((m) => markerHalfWidth(m) + markerRelativeX(m.temp) - STRIP_WIDTH)
        )
  )

  const STRIP_LEFT = $derived(LEFT_OVERHANG + PADDING_HORIZONTAL)
  const STRIP_RIGHT = $derived(STRIP_LEFT + STRIP_WIDTH)
  const WIDTH = $derived(STRIP_RIGHT + RIGHT_OVERHANG + PADDING_HORIZONTAL)

  // ===== 色温度 → X座標 =====
  const xAt = (temp: number): number =>
    STRIP_LEFT + ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  // ===== アイコンのY位置（左上基準） =====
  const ICON_Y = STRIP_Y + STRIP_HEIGHT + TICK_LENGTH + GAP_TICK_TO_ICON
  // ===== ラベルの中心Y位置 =====
  const LABEL_Y = ICON_Y + LAMP_ICON_SIZE + GAP_ICON_TO_LABEL + FONT_SIZE_LABEL / 2

  const gradientId = `color-temperature-gradient-marked-${Math.random().toString(36).slice(2, 10)}`

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect
    x="0"
    y="0"
    width={WIDTH}
    height={HEIGHT}
    fill="light-dark(#545d66, var(--color-bg--dark))"
  />

  <!-- 帯（色温度のグラデーション） -->
  <rect
    x={STRIP_LEFT}
    y={STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#{gradientId})"
  />

  <!-- マーカー（帯の下） -->
  {#each markers as marker (marker.temp)}
    {@const x = xAt(marker.temp)}
    {@const tempColor = chroma.temperature(marker.temp).hex()}
    <line
      x1={x}
      y1={STRIP_Y + STRIP_HEIGHT}
      x2={x}
      y2={STRIP_Y + STRIP_HEIGHT + TICK_LENGTH}
      stroke={tempColor}
      stroke-width={STROKE_WIDTH_TICK}
    />
    <g transform="translate({x - LAMP_ICON_SIZE / 2}, {ICON_Y})">
      <LampIcon temperature={marker.temp} size={LAMP_ICON_SIZE} />
    </g>
    {#if marker.label}
      <text
        {x}
        y={LABEL_Y}
        fill={tempColor}
        font-size={FONT_SIZE_LABEL}
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="central"
        visibility={isAnki ? "hidden" : "visible"}
      >
        {marker.label}
      </text>
    {/if}
  {/each}
</svg>
