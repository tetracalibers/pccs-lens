<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"

  let {
    displayedPCCSList,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    techniqueHighlightHues = null
  }: {
    displayedPCCSList: PCCSColor[]
    techniqueHighlightHues?: number[] | null
  } = $props()

  const CX = 160
  const CY = 160
  const R = 110
  const R_INNER = 28
  const R_LINE = 105
  const R_LABEL = 130

  const HUE_COLORS: Record<number, string> = {
    1: "#D40045",
    2: "#EE0026",
    3: "#FD1A1C",
    4: "#FE4118",
    5: "#FF590B",
    6: "#FF7F00",
    7: "#FFCC00",
    8: "#FFE600",
    9: "#CCE700",
    10: "#99CF15",
    11: "#66B82B",
    12: "#33A23D",
    13: "#008F62",
    14: "#008678",
    15: "#007A87",
    16: "#055D87",
    17: "#093F86",
    18: "#0F218B",
    19: "#1D1A88",
    20: "#281285",
    21: "#340C81",
    22: "#56007D",
    23: "#770071",
    24: "#AF0065"
  }

  const HUE_NAMES: Record<number, string> = {
    1: "pR",
    2: "R",
    3: "yR",
    4: "rO",
    5: "O",
    6: "yO",
    7: "rY",
    8: "Y",
    9: "gY",
    10: "YG",
    11: "yG",
    12: "G",
    13: "bG",
    14: "BG",
    15: "GB",
    16: "gB",
    17: "B",
    18: "B",
    19: "pB",
    20: "V",
    21: "bP",
    22: "P",
    23: "rP",
    24: "RP"
  }

  function toRad(deg: number) {
    return (deg * Math.PI) / 180
  }

  function polar(r: number, deg: number) {
    return {
      x: CX + r * Math.cos(toRad(deg)),
      y: CY + r * Math.sin(toRad(deg))
    }
  }

  function sectorPath(h: number): string {
    const start = (h - 1) * 15 - 90
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
    return (h - 1) * 15 + 7.5 - 90
  }

  const highlightedEntries = $derived(
    displayedPCCSList.filter((c) => !c.isNeutral && c.hueNumber !== null)
  )

  const highlightedHueSet = $derived(new Set(highlightedEntries.map((c) => c.hueNumber)))

  const hasHighlights = $derived(highlightedEntries.length > 0)
</script>

<svg viewBox="0 0 320 320" role="img" aria-label="PCCS色相環" style="pointer-events: none;">
  <!-- Sectors -->
  {#each Array.from({ length: 24 }, (_, i) => i + 1) as h (h)}
    {@const isHighlighted = highlightedHueSet.has(h)}
    <path
      d={sectorPath(h)}
      fill={HUE_COLORS[h]}
      stroke="white"
      stroke-width="0.5"
      opacity={hasHighlights && !isHighlighted ? 0.45 : 1}
    />
    {#if isHighlighted}
      <path d={sectorPath(h)} fill="none" stroke="#222" stroke-width="2.5" />
    {/if}
  {/each}

  <!-- Direction lines for highlighted hues -->
  {#each highlightedEntries as color (color.notation)}
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

  <!-- Center dot -->
  <circle cx={CX} cy={CY} r="4" fill="#444" />

  <!-- Labels (even hues only) -->
  {#each Array.from({ length: 12 }, (_, i) => (i + 1) * 2) as h (h)}
    {@const pos = polar(R_LABEL, sectorMidDeg(h))}
    <text
      x={pos.x.toFixed(3)}
      y={pos.y.toFixed(3)}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="8.5"
      fill="#444">{h}:{HUE_NAMES[h]}</text
    >
  {/each}
</svg>
