<script lang="ts">
  import { grayHexForLightness } from "$lib/color/lightnessContrast"

  interface Props {
    /** 基準色のマンセル Value（0〜10）。 */
    baseValue: number
    /** 基準色の HEX。 */
    baseColor: string
    /** 選択色のマンセル Value（0〜10）。 */
    selectedValue: number
    /** 選択色の HEX。 */
    selectedColor: string
  }

  let { baseValue, baseColor, selectedValue, selectedColor }: Props = $props()

  // ===== SVG dimensions =====
  const WIDTH = 168
  const HEIGHT = 150

  // ===== Layout constants =====
  const PAD_TOP = 18
  const PAD_BOTTOM = 18
  const BAR_W = 22
  const BAR_X = (WIDTH - BAR_W) / 2
  const V_MAX = 10
  const MARKER_R = 9
  const CONNECTOR = 20
  const FONT_SIZE_VALUE = 12
  const FONT_SIZE_CAPTION = 10
  const STROKE_WIDTH_MARKER = 2

  // ===== Colors =====
  const COL_TEXT = "var(--color-heading)"
  const COL_MUTED = "var(--color-body)"
  const COL_BORDER = "var(--color-border, rgba(128, 128, 128, 0.5))"
  const COL_GUIDE = "var(--color-muted, rgba(128, 128, 128, 0.4))"

  const axisTop = PAD_TOP
  const axisBottom = HEIGHT - PAD_BOTTOM

  const valueToY = (v: number): number =>
    axisBottom - (Math.max(0, Math.min(V_MAX, v)) / V_MAX) * (axisBottom - axisTop)

  // マンセル明度スケール。Value 1 段ごとの無彩色セルを、下（暗）から上（明）へ離散的に並べる。
  // 各セルの色は L* ≈ Value×10 でグレー化する（帯の中央値を採用）。
  const SCALE_CELLS = Array.from({ length: V_MAX }, (_, i) => {
    const yTop = valueToY(i + 1)
    const yBottom = valueToY(i)
    return {
      value: i,
      y: yTop,
      height: yBottom - yTop,
      color: grayHexForLightness((i + 0.5) * 10)
    }
  })

  const baseY = $derived(valueToY(baseValue))
  const selY = $derived(valueToY(selectedValue))
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  class="axis"
  role="img"
  aria-label="明度スケール。基準色の明度 {baseValue}、選択色の明度 {selectedValue}。"
>
  <!-- マンセル明度スケール本体：無彩色を下（暗）から上（明）へ段階的に並べる -->
  {#each SCALE_CELLS as cell (cell.value)}
    <rect x={BAR_X} y={cell.y} width={BAR_W} height={cell.height} fill={cell.color} />
  {/each}
  <rect
    x={BAR_X}
    y={axisTop}
    width={BAR_W}
    height={axisBottom - axisTop}
    fill="none"
    stroke={COL_BORDER}
    stroke-width="1"
  />

  <!-- 明 / 暗 のキャプション -->
  <text
    x={WIDTH / 2}
    y={axisTop - 6}
    text-anchor="middle"
    font-size={FONT_SIZE_CAPTION}
    fill={COL_MUTED}>明</text
  >
  <text
    x={WIDTH / 2}
    y={axisBottom + 12}
    text-anchor="middle"
    font-size={FONT_SIZE_CAPTION}
    fill={COL_MUTED}>暗</text
  >

  <!-- 高さ比較用のガイド線（同じ明度なら重なる） -->
  <line
    x1="0"
    y1={baseY}
    x2={WIDTH}
    y2={baseY}
    stroke={COL_GUIDE}
    stroke-width="1"
    stroke-dasharray="3 3"
  />
  <line
    x1="0"
    y1={selY}
    x2={WIDTH}
    y2={selY}
    stroke={COL_GUIDE}
    stroke-width="1"
    stroke-dasharray="3 3"
  />

  <!-- 基準色マーカー（左） -->
  <line x1={BAR_X} y1={baseY} x2={BAR_X - CONNECTOR} y2={baseY} stroke={COL_TEXT} stroke-width="1" />
  <circle
    cx={BAR_X - CONNECTOR}
    cy={baseY}
    r={MARKER_R}
    fill={baseColor}
    stroke={COL_TEXT}
    stroke-width={STROKE_WIDTH_MARKER}
  />
  <text
    x={BAR_X - CONNECTOR - MARKER_R - 4}
    y={baseY + FONT_SIZE_VALUE / 3}
    text-anchor="end"
    font-size={FONT_SIZE_VALUE}
    font-weight="700"
    fill={COL_TEXT}>{baseValue}</text
  >

  <!-- 選択色マーカー（右） -->
  <line
    x1={BAR_X + BAR_W}
    y1={selY}
    x2={BAR_X + BAR_W + CONNECTOR}
    y2={selY}
    stroke={COL_TEXT}
    stroke-width="1"
  />
  <circle
    cx={BAR_X + BAR_W + CONNECTOR}
    cy={selY}
    r={MARKER_R}
    fill={selectedColor}
    stroke={COL_TEXT}
    stroke-width={STROKE_WIDTH_MARKER}
  />
  <text
    x={BAR_X + BAR_W + CONNECTOR + MARKER_R + 4}
    y={selY + FONT_SIZE_VALUE / 3}
    text-anchor="start"
    font-size={FONT_SIZE_VALUE}
    font-weight="700"
    fill={COL_TEXT}>{selectedValue}</text
  >
</svg>

<style>
  .axis {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
