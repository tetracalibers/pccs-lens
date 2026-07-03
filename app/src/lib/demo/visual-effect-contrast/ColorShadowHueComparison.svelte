<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== 円（色相環）のジオメトリ =====
  const RING_R = 250 // 正方形の中心が並ぶ円の半径
  const SQ = 76 // 各色相の正方形の一辺
  const MARGIN = 8 // viewBox 外周の余白

  const HALF_EXTENT = RING_R + SQ / 2 + MARGIN
  const VIEW_SIZE = 2 * HALF_EXTENT
  const CX = HALF_EXTENT
  const CY = HALF_EXTENT

  // ===== アイコン（中央のグレイ） =====
  const ICON_ID = "mynaui:flower-solid"
  const ICON_SIZE = Math.round(SQ * 0.55) // 正方形中央に置くアイコンのサイズ
  const GY_NOTATION = "Gy-8.0" // 中央アイコンの色（PCCS 無彩色）

  // ===== 線 =====
  const RING_STROKE_WIDTH = 2

  // ===== 色 =====
  const COL_RING = "var(--color-body)"

  const ICON_HEX = PCCS_HEX_MAP.get(GY_NOTATION) ?? "#C8C8C8"

  // PCCS 色相環の偶数色相（v トーンで塗る）
  const EVEN_HUES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

  // PCCS 番号 → SVG 角度（度）。番号 2 を 9時（180°）として 15° 刻みで時計回り。
  // SVG y-down 座標: 0=東(3時), 90=南(6時), 180=西(9時), 270=北(12時)。
  function hueAngle(hue: number): number {
    return (180 + (hue - 2) * 15 + 360 * 10) % 360
  }

  type HueCell = {
    hue: number
    cx: number
    cy: number
    hex: string
  }

  const CELLS: HueCell[] = EVEN_HUES.map((hue) => {
    const rad = (hueAngle(hue) * Math.PI) / 180
    return {
      hue,
      cx: CX + RING_R * Math.cos(rad),
      cy: CY + RING_R * Math.sin(rad),
      hex: PCCS_HEX_MAP.get(`v${hue}`) ?? "#000000"
    }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}">
  <!-- 色相環（円） -->
  <circle
    cx={CX}
    cy={CY}
    r={RING_R}
    fill="none"
    stroke={COL_RING}
    stroke-width={RING_STROKE_WIDTH}
  />

  {#each CELLS as cell (cell.hue)}
    <!-- その色相の v トーンで塗りつぶした正方形 -->
    <rect x={cell.cx - SQ / 2} y={cell.cy - SQ / 2} width={SQ} height={SQ} fill={cell.hex} />

    <!-- 正方形の中央に置く Gy-8.0 のアイコン -->
    <foreignObject
      x={cell.cx - ICON_SIZE / 2}
      y={cell.cy - ICON_SIZE / 2}
      width={ICON_SIZE}
      height={ICON_SIZE}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {ICON_HEX}; display: grid; place-items: center;"
      >
        <Icon icon={ICON_ID} width={ICON_SIZE} height={ICON_SIZE} />
      </div>
    </foreignObject>
  {/each}
</svg>
