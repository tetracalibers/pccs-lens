<script lang="ts">
  let {
    value,
    suggestedHues,
    allowedHues,
    onselect
  }: {
    value: number | null
    suggestedHues: number[]
    allowedHues: number[]
    onselect: (hue: number) => void
  } = $props()

  const CX = 160
  const CY = 160
  const R = 110
  const R_INNER = 28
  const R_LABEL = 135
  const ROTATION_OFFSET = -202.5

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

  const suggestedSet = $derived(new Set(suggestedHues))
  const allowedSet = $derived(new Set(allowedHues))

  // value === null のとき（無彩色選択中）はハイライトなし
  const isAchromaticSelected = $derived(value === null)

  function getOpacity(h: number): number {
    if (isAchromaticSelected) return 1
    if (suggestedSet.has(h)) return 1
    if (allowedSet.has(h)) return 0.6
    return 0.25
  }

  function isSelected(h: number): boolean {
    return !isAchromaticSelected && value === h
  }

  const HUES = Array.from({ length: 24 }, (_, i) => i + 1)
</script>

<svg viewBox="0 0 320 320" role="group" aria-label="色相選択" style="width: 100%; cursor: pointer;">
  <!-- Sectors -->
  {#each HUES as h (h)}
    <path
      d={sectorPath(h)}
      fill={HUE_COLORS[h]}
      stroke="white"
      stroke-width="0.5"
      opacity={getOpacity(h)}
      role="button"
      aria-label="{h}:{HUE_NAMES[h]}"
      aria-pressed={isSelected(h)}
      tabindex="0"
      style="cursor: pointer;"
      onclick={() => onselect(h)}
      onkeydown={(e) => e.key === "Enter" && onselect(h)}
    />
  {/each}

  <!-- Selected border -->
  {#each HUES as h (h)}
    {#if isSelected(h)}
      <path
        d={sectorPath(h)}
        fill="none"
        stroke="white"
        stroke-width="3"
        style="pointer-events: none;"
      />
      <path
        d={sectorPath(h)}
        fill="none"
        stroke={`oklch(from ${HUE_COLORS[h]} calc(l * .75) c h)`}
        stroke-width="1.5"
        style="pointer-events: none;"
      />
    {/if}
  {/each}

  <circle cx={CX} cy={CY} r={R_INNER + 1} fill="white" style="pointer-events: none;" />

  <!-- Labels (suggested hues + even hues) -->
  {#each HUES as h (h)}
    {@const isSuggested = !isAchromaticSelected && suggestedSet.has(h)}
    {#if isSuggested || h % 2 === 0}
      {@const pos = polar(R_LABEL, sectorMidDeg(h))}
      <text
        x={pos.x.toFixed(3)}
        y={pos.y.toFixed(3)}
        text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--font-mono)"
        font-size={isSuggested ? 13 : 11}
        font-weight={isSuggested ? "bold" : "normal"}
        fill={isSuggested ? HUE_COLORS[h] : "#555"}
        opacity={getOpacity(h)}
        style="pointer-events: none; user-select: none;"
      >
        {h}
      </text>
    {/if}
  {/each}
</svg>
