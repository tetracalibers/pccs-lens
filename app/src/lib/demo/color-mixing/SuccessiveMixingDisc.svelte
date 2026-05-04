<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== SVG dimensions =====
  const SIZE = 300
  const CENTER = SIZE / 2

  // ===== Layout constants =====
  const RADIUS = 150
  const OUTLINE_STROKE_WIDTH = 1.5

  // ===== Colors =====
  const COL_OUTLINE = "var(--color-body)"
  const COL_A = PCCS_HEX_MAP.get("v2")!
  const COL_B = PCCS_HEX_MAP.get("v8")!
  const COL_C = PCCS_HEX_MAP.get("v18")!
  const COLORS = [COL_A, COL_B, COL_C]

  // ===== セクターパス =====
  const NUM_SECTORS = COLORS.length
  const SECTOR_ANGLE = 360 / NUM_SECTORS
  const START_DEG = -90 // 12時方向から開始

  function sectorPath(i: number): string {
    const startDeg = START_DEG + i * SECTOR_ANGLE
    const endDeg = startDeg + SECTOR_ANGLE
    const startRad = (startDeg * Math.PI) / 180
    const endRad = (endDeg * Math.PI) / 180
    const x1 = CENTER + RADIUS * Math.cos(startRad)
    const y1 = CENTER + RADIUS * Math.sin(startRad)
    const x2 = CENTER + RADIUS * Math.cos(endRad)
    const y2 = CENTER + RADIUS * Math.sin(endRad)
    const largeArcFlag = SECTOR_ANGLE > 180 ? 1 : 0
    return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  {#each COLORS as color, i (i)}
    <path d={sectorPath(i)} fill={color} />
  {/each}

  <circle
    cx={CENTER}
    cy={CENTER}
    r={RADIUS}
    fill="none"
    stroke={COL_OUTLINE}
    stroke-width={OUTLINE_STROKE_WIDTH}
  />
</svg>
