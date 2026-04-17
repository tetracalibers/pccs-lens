<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"

  let {
    displayedPCCSList,
    useToneColor = false
  }: {
    displayedPCCSList: PCCSColor[]
    useToneColor?: boolean
  } = $props()

  const CX = 160
  const CY = 160
  const R = 110
  const R_INNER = 28
  const R_LINE = 105
  const R_LABEL = 135
  const R_LABEL_HIGHLIGHTED = 138

  function toRad(deg: number) {
    return (deg * Math.PI) / 180
  }

  function polar(r: number, deg: number) {
    return {
      x: CX + r * Math.cos(toRad(deg)),
      y: CY + r * Math.sin(toRad(deg))
    }
  }

  // hue 8:Y が真上 (-90°) になるオフセット
  // hue 8 の中心 = (8-1)*15 + 7.5 = 112.5° → -90° にするには -202.5°
  const ROTATION_OFFSET = -202.5

  function sectorPath(h: number): string {
    const start = (h - 1) * 15 + ROTATION_OFFSET
    const end = start + 15
    const o1 = polar(R, start)
    const o2 = polar(R, end)
    const i2 = polar(R_INNER, end)
    const i1 = polar(R_INNER, start)
    return [
      `M ${o1.x.toFixed(3)} ${o1.y.toFixed(3)}`,
      `A ${R} ${R} 0 0 1 ${o2.x.toFixed(3)} ${o2.y.toFixed(3)}`,
      `L ${i2.x.toFixed(3)} ${i2.y.toFixed(3)}`,
      `A ${R_INNER} ${R_INNER} 0 0 0 ${i1.x.toFixed(3)} ${i1.y.toFixed(3)}`,
      "Z"
    ].join(" ")
  }

  function sectorMidDeg(h: number) {
    return (h - 1) * 15 + 7.5 + ROTATION_OFFSET
  }

  const highlightedEntries = $derived(
    displayedPCCSList.filter((c) => !c.isNeutral && c.hueNumber !== null)
  )

  const highlightedHueSet = $derived(new Set(highlightedEntries.map((c) => c.hueNumber)))

  /** hueNumber → displayedPCCSListで指定されたトーンのhex */
  const highlightedHexMap = $derived(new Map(highlightedEntries.map((c) => [c.hueNumber!, c.hex])))

  const hasHighlights = $derived(highlightedEntries.length > 0)

  function hueColor(h: number): string {
    return PCCS_HUE_MAP.get(h)?.color ?? "#ccc"
  }

  /** useToneColor時はハイライト色相に指定トーンの色を使う */
  function effectiveColor(h: number): string {
    if (useToneColor && highlightedHexMap.has(h)) {
      return highlightedHexMap.get(h)!
    }
    return hueColor(h)
  }
</script>

<svg viewBox="0 0 320 320" role="img" aria-label="PCCS色相環" style="pointer-events: none;">
  <!-- Background circle -->
  <circle cx={CX} cy={CY} r={R} fill="white" fill-opacity={useToneColor ? 1 : 0.8} />

  <!-- Sectors -->
  {#each Array.from({ length: 24 }, (_, i) => i + 1) as h (h)}
    {@const isHighlighted = highlightedHueSet.has(h)}
    <path
      d={sectorPath(h)}
      fill={isHighlighted ? effectiveColor(h) : hueColor(h)}
      stroke="white"
      stroke-width="0.5"
      opacity={!isHighlighted ? (useToneColor ? 0.25 : 0.45) : 1}
    />
  {/each}

  <!-- Highlight borders -->
  {#each Array.from({ length: 24 }, (_, i) => i + 1) as h (h)}
    {@const isHighlighted = highlightedHueSet.has(h)}
    {#if isHighlighted}
      <path
        d={sectorPath(h)}
        fill="none"
        stroke={`oklch(from ${effectiveColor(h)} calc(l * .85) c h)`}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/if}
  {/each}

  <!-- Direction lines for highlighted hues -->
  {#each highlightedEntries as color, i (i)}
    {@const mid = sectorMidDeg(color.hueNumber!)}
    {@const end = polar(R_LINE, mid)}
    <line
      x1={CX}
      y1={CY}
      x2={end.x.toFixed(3)}
      y2={end.y.toFixed(3)}
      stroke="white"
      stroke-width="1.5"
      opacity="0.85"
    />
  {/each}

  <circle cx={CX} cy={CY} r={R_INNER + 1} style="fill: light-dark(white, #0c0c14);" />

  <!-- Labels (even hues + highlighted hues) -->
  {#each Array.from({ length: 24 }, (_, i) => i + 1) as h (h)}
    {@const isHighlighted = highlightedHueSet.has(h)}
    {#if isHighlighted || h % 2 === 0}
      {@const pos = polar(isHighlighted ? R_LABEL_HIGHLIGHTED : R_LABEL, sectorMidDeg(h))}
      <text
        x={pos.x.toFixed(3)}
        y={pos.y.toFixed(3)}
        text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--font-mono)"
        font-size={isHighlighted ? 14 : 12}
        font-weight={isHighlighted ? "bold" : "normal"}
        style="fill: {isHighlighted
          ? `color-mix(in oklch, ${effectiveColor(h)} 70%, var(--color-body--dark) 30%)`
          : 'var(--color-body)'};"
        opacity={hasHighlights && !isHighlighted ? 0.75 : 1}
      >
        {PCCS_HUE_MAP.get(h)?.symbol ?? h}
      </text>
    {/if}
  {/each}
</svg>
