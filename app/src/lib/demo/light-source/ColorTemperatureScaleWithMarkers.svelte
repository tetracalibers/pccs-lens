<script lang="ts">
  import chroma from "chroma-js"
  import LampIcon from "./LampIcon.svelte"

  interface Props {
    temperatures: number[]
  }

  let { temperatures }: Props = $props()

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

  // ===== 外側パディング =====
  const PADDING_VERTICAL = 12
  const PADDING_HORIZONTAL = 12

  // ===== グラデーションストップ生成 =====
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return {
      offset: t,
      color: chroma.temperature(temp).hex()
    }
  })

  // ===== SVG の大きさ・帯の位置（他の値から自動算出） =====
  // 帯下：tick + 隙間 + アイコン本体
  const stackExtent = TICK_LENGTH + GAP_TICK_TO_ICON + LAMP_ICON_SIZE

  const STRIP_Y = PADDING_VERTICAL
  const HEIGHT = STRIP_Y + STRIP_HEIGHT + stackExtent + PADDING_VERTICAL

  // 横：各アイコンが帯端からはみ出す量を集計（アイコンは中心揃え）
  const markerRelativeX = (temp: number): number =>
    ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  const LEFT_OVERHANG = $derived(
    temperatures.length === 0
      ? 0
      : Math.max(0, ...temperatures.map((t) => LAMP_ICON_SIZE / 2 - markerRelativeX(t)))
  )
  const RIGHT_OVERHANG = $derived(
    temperatures.length === 0
      ? 0
      : Math.max(
          0,
          ...temperatures.map((t) => LAMP_ICON_SIZE / 2 + markerRelativeX(t) - STRIP_WIDTH)
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

  <!-- 背景 -->
  <rect
    x="0"
    y="0"
    width={WIDTH}
    height={HEIGHT}
    rx={8}
    fill="light-dark(lightslategray, var(--color-bg--dark))"
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
  {#each temperatures as temp (temp)}
    {@const x = xAt(temp)}
    {@const tempColor = chroma.temperature(temp).hex()}
    <line
      x1={x}
      y1={STRIP_Y + STRIP_HEIGHT}
      x2={x}
      y2={STRIP_Y + STRIP_HEIGHT + TICK_LENGTH}
      stroke={tempColor}
      stroke-width={STROKE_WIDTH_TICK}
    />
    <g transform="translate({x - LAMP_ICON_SIZE / 2}, {ICON_Y})">
      <LampIcon temperature={temp} size={LAMP_ICON_SIZE} />
    </g>
  {/each}
</svg>
