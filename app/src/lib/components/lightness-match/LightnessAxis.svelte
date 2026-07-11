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
  const WIDTH = 144
  const HEIGHT = 150

  // ===== Layout constants =====
  const PAD_TOP = 6
  const PAD_BOTTOM = 6
  const V_MAX = 10
  const SWATCH_GAP = 6
  const LABEL_GAP = 5
  const FONT_SIZE_VALUE = 12
  const STROKE_WIDTH_SWATCH = 1

  // ===== Colors =====
  const COL_TEXT = "var(--color-heading)"
  const COL_BORDER = "var(--color-border, rgba(128, 128, 128, 0.5))"

  const axisTop = PAD_TOP
  const axisBottom = HEIGHT - PAD_BOTTOM
  // セルの高さ（縦に V_MAX 段並ぶ）。幅はこれより少し広くして横長のセルにする。
  const CELL = (axisBottom - axisTop) / V_MAX
  const BAR_W = 20
  const BAR_X = (WIDTH - BAR_W) / 2
  const SWATCH_W = CELL

  const valueToY = (v: number): number =>
    axisBottom - (Math.max(0, Math.min(V_MAX, v)) / V_MAX) * (axisBottom - axisTop)

  // マンセル明度スケール。Value 1 段ごとの無彩色セルを、下（暗）から上（明）へ並べる。
  // 各セルの色は L* ≈ Value×10 でグレー化する（帯の中央値を採用）。
  const SCALE_CELLS = Array.from({ length: V_MAX }, (_, i) => ({
    value: i,
    y: valueToY(i + 1),
    height: valueToY(i) - valueToY(i + 1),
    color: grayHexForLightness((i + 0.5) * 10)
  }))

  // 実際の色の四角形は、同じ明度のセルの真横（基準色=左、選択色=右）に置く。
  const baseSwatchX = BAR_X - SWATCH_GAP - SWATCH_W
  const selSwatchX = BAR_X + BAR_W + SWATCH_GAP

  const baseSwatchY = $derived(valueToY(baseValue) - CELL / 2)
  const selSwatchY = $derived(valueToY(selectedValue) - CELL / 2)
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

  <!-- 基準色（左）：同じ明度のセルの隣に実際の色を配置 -->
  <rect
    x={baseSwatchX}
    y={baseSwatchY}
    width={SWATCH_W}
    height={CELL}
    fill={baseColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <text
    x={baseSwatchX - LABEL_GAP}
    y={valueToY(baseValue) + FONT_SIZE_VALUE / 3}
    text-anchor="end"
    font-size={FONT_SIZE_VALUE}
    font-weight="700"
    fill={COL_TEXT}>{baseValue}</text
  >

  <!-- 選択色（右）：同じ明度のセルの隣に実際の色を配置 -->
  <rect
    x={selSwatchX}
    y={selSwatchY}
    width={SWATCH_W}
    height={CELL}
    fill={selectedColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <text
    x={selSwatchX + SWATCH_W + LABEL_GAP}
    y={valueToY(selectedValue) + FONT_SIZE_VALUE / 3}
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
