<script lang="ts">
  import { grayHexForLightness } from "$lib/color/lightnessContrast"

  interface Props {
    /** 基準色のマンセル Value（0〜10）。 */
    baseValue: number
    /** 基準色の HEX。 */
    baseColor: string
    /** 基準色の慣用色名。 */
    baseName: string
    /** 選択色のマンセル Value（0〜10）。 */
    selectedValue: number
    /** 選択色の HEX。 */
    selectedColor: string
    /** 選択色の慣用色名。 */
    selectedName: string
  }

  let { baseValue, baseColor, baseName, selectedValue, selectedColor, selectedName }: Props =
    $props()

  // ===== SVG dimensions =====
  const WIDTH = 200
  const HEIGHT = 168

  // ===== 明度スケール＋セル横のマーカー（左） =====
  const PAD_TOP = 6
  const PAD_BOTTOM = 6
  const V_MAX = 10
  const BAR_X = 46
  const BAR_W = 20
  const MARK_GAP = 5
  const LABEL_GAP = 5
  const FONT_SIZE_VALUE = 12
  const STROKE_WIDTH_SWATCH = 1

  // ===== 大きい色スウォッチの縦並び＋慣用色名（右） =====
  const BIG = 52
  const BIG_GAP = 8
  const BIG_X = 127
  const NAME_FS = 14
  const NAME_GAP = 8

  // ===== Colors =====
  const COL_TEXT = "var(--color-heading)"
  const COL_BORDER = "var(--color-border, rgba(128, 128, 128, 0.5))"

  const axisTop = PAD_TOP
  const axisBottom = HEIGHT - PAD_BOTTOM
  // セルの高さ（縦に V_MAX 段並ぶ）。幅はこれより少し広くして横長のセルにする。
  const CELL = (axisBottom - axisTop) / V_MAX
  const MARK_W = CELL

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

  // 左：同じ明度のセルの真横に置く小さなマーカー（基準色=左、選択色=右）。
  const baseMarkX = BAR_X - MARK_GAP - MARK_W
  const selMarkX = BAR_X + BAR_W + MARK_GAP
  const baseMarkY = $derived(valueToY(baseValue) - CELL / 2)
  const selMarkY = $derived(valueToY(selectedValue) - CELL / 2)

  // 右：色を見比べる大きいスウォッチ。明度が高い色ほど上に配置し、上下に慣用色名を添える。
  const nameCenterX = BIG_X + BIG / 2
  const centerY = (axisTop + axisBottom) / 2
  const blockH = 2 * BIG + BIG_GAP + 2 * (NAME_GAP + NAME_FS)
  const blockTop = centerY - blockH / 2
  const topNameY = blockTop + NAME_FS
  const topBigY = blockTop + NAME_FS + NAME_GAP
  const bottomBigY = topBigY + BIG + BIG_GAP
  const bottomNameY = bottomBigY + BIG + NAME_GAP + NAME_FS

  const topIsBase = $derived(baseValue >= selectedValue)
  const topColor = $derived(topIsBase ? baseColor : selectedColor)
  const bottomColor = $derived(topIsBase ? selectedColor : baseColor)
  const topName = $derived(topIsBase ? baseName : selectedName)
  const bottomName = $derived(topIsBase ? selectedName : baseName)
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

  <!-- 基準色マーカー（左）：同じ明度のセルの真横 -->
  <rect
    x={baseMarkX}
    y={baseMarkY}
    width={MARK_W}
    height={CELL}
    fill={baseColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <text
    x={baseMarkX - LABEL_GAP}
    y={valueToY(baseValue) + FONT_SIZE_VALUE / 3}
    text-anchor="end"
    font-size={FONT_SIZE_VALUE}
    font-weight="700"
    fill={COL_TEXT}
  >
    {baseValue}
  </text>

  <!-- 選択色マーカー（右）：同じ明度のセルの真横 -->
  <rect
    x={selMarkX}
    y={selMarkY}
    width={MARK_W}
    height={CELL}
    fill={selectedColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <text
    x={selMarkX + MARK_W + LABEL_GAP}
    y={valueToY(selectedValue) + FONT_SIZE_VALUE / 3}
    text-anchor="start"
    font-size={FONT_SIZE_VALUE}
    font-weight="700"
    fill={COL_TEXT}
  >
    {selectedValue}
  </text>

  <!-- 大きい色スウォッチ（上＝明度が高い色 / 下＝明度が低い色）と慣用色名 -->
  <text x={nameCenterX} y={topNameY} text-anchor="middle" font-size={NAME_FS} fill={COL_TEXT}>
    {topName}
  </text>
  <rect
    x={BIG_X}
    y={topBigY}
    width={BIG}
    height={BIG}
    fill={topColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <rect
    x={BIG_X}
    y={bottomBigY}
    width={BIG}
    height={BIG}
    fill={bottomColor}
    stroke={COL_BORDER}
    stroke-width={STROKE_WIDTH_SWATCH}
  />
  <text x={nameCenterX} y={bottomNameY} text-anchor="middle" font-size={NAME_FS} fill={COL_TEXT}>
    {bottomName}
  </text>
</svg>

<style>
  .axis {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
