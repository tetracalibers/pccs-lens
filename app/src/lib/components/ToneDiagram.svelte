<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"

  let {
    displayedPCCSList,
    isCard199,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    techniqueHighlightTones = null
  }: {
    displayedPCCSList: PCCSColor[]
    isCard199: boolean
    techniqueHighlightTones?: string[] | null
  } = $props()

  type ToneCell = {
    key: string
    label: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  // Staggered midpoint layout
  // Col0 (achromatic): y = 25, 75, 125, 175, 225  step=50
  // Col1 (p/ltg/g/dkg): midpoints of Col0 pairs → y = 50, 100, 150, 200
  // Col2 (lt/sf/d/dk): same as Col1 → y = 50, 100, 150, 200
  // Col3 (b/s/dp): midpoints of Col1 pairs → y = 75, 125, 175
  // Col4 (v): Col3[1] → y = 125
  const X0 = 26
  const X1 = 94
  const X2 = 154
  const X3 = 214
  const X4 = 274

  const CELLS: ToneCell[] = [
    // Col0: achromatic squares
    { key: "W", label: "W", cx: X0, cy: 25, shape: "square" },
    { key: "ltGy", label: "ltGy", cx: X0, cy: 75, shape: "square" },
    { key: "mGy", label: "mGy", cx: X0, cy: 125, shape: "square" },
    { key: "dkGy", label: "dkGy", cx: X0, cy: 175, shape: "square" },
    { key: "Bk", label: "Bk", cx: X0, cy: 225, shape: "square" },
    // Col1: p/ltg/g/dkg
    { key: "p", label: "p", cx: X1, cy: 50, shape: "circle" },
    { key: "ltg", label: "ltg", cx: X1, cy: 100, shape: "circle" },
    { key: "g", label: "g", cx: X1, cy: 150, shape: "circle" },
    { key: "dkg", label: "dkg", cx: X1, cy: 200, shape: "circle" },
    // Col2: lt/sf/d/dk
    { key: "lt", label: "lt", cx: X2, cy: 50, shape: "circle" },
    { key: "sf", label: "sf", cx: X2, cy: 100, shape: "circle" },
    { key: "d", label: "d", cx: X2, cy: 150, shape: "circle" },
    { key: "dk", label: "dk", cx: X2, cy: 200, shape: "circle" },
    // Col3: b/s/dp
    { key: "b", label: "b", cx: X3, cy: 75, shape: "circle" },
    { key: "s", label: "s", cx: X3, cy: 125, shape: "circle" },
    { key: "dp", label: "dp", cx: X3, cy: 175, shape: "circle" },
    // Col4: v
    { key: "v", label: "v", cx: X4, cy: 125, shape: "circle" }
  ]

  const CIRCLE_R = 20
  const SQUARE_HALF = 18

  function getUsedColors(cell: ToneCell): PCCSColor[] {
    return displayedPCCSList.filter((c) => {
      if (c.isNeutral) return c.achromaticBucket === cell.key
      return c.toneSymbol === cell.key
    })
  }

  function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
  }

  type TooltipState = {
    visible: boolean
    x: number
    y: number
    colors: PCCSColor[]
  }

  let tooltip: TooltipState = $state({ visible: false, x: 0, y: 0, colors: [] })
  let wrapperEl: HTMLDivElement | undefined = $state()

  function showTooltip(e: PointerEvent, cell: ToneCell) {
    const usedColors = getUsedColors(cell)
    if (usedColors.length === 0) return
    const rect = wrapperEl!.getBoundingClientRect()
    tooltip = {
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      colors: usedColors
    }
  }

  function hideTooltip() {
    tooltip = { ...tooltip, visible: false }
  }

  $effect(() => {
    if (!tooltip.visible) return
    function onOutsidePointer(e: PointerEvent) {
      if (wrapperEl && !wrapperEl.contains(e.target as Node)) hideTooltip()
    }
    document.addEventListener("pointerdown", onOutsidePointer)
    return () => document.removeEventListener("pointerdown", onOutsidePointer)
  })

  // Pre-compute usedColors for each cell for reactivity
  const cellData = $derived(CELLS.map((cell) => ({ ...cell, usedColors: getUsedColors(cell) })))
</script>

<div class="diagram-wrapper" bind:this={wrapperEl}>
  <svg viewBox="0 0 300 250" role="img" aria-label="PCCSトーン概念図">
    <defs>
      <pattern
        id="hatch"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="8" stroke="#bbb" stroke-width="2" />
      </pattern>
    </defs>

    {#each cellData as cell (cell.key)}
      {@const isUsed = cell.usedColors.length > 0}
      {@const isSCell = cell.key === "s"}
      {@const showHatch = isSCell && isCard199 && !isUsed}
      {@const fillColor = isUsed ? cell.usedColors[0].hex : showHatch ? "url(#hatch)" : "white"}
      {@const strokeColor = isUsed ? "#333" : "#ccc"}
      {@const strokeWidth = isUsed ? 3 : 1}
      {@const labelFill = isUsed
        ? isLightColor(cell.usedColors[0].hex)
          ? "#333"
          : "#fff"
        : isSCell && isCard199
          ? "#bbb"
          : "#aaa"}
      {@const cellOpacity = isSCell && isCard199 && !isUsed ? 0.5 : 1}

      <g
        opacity={cellOpacity}
        role={isUsed ? "img" : undefined}
        aria-label={isUsed
          ? `${cell.label}: ${cell.usedColors.map((c) => c.notation).join(", ")}`
          : undefined}
        style={isUsed ? "touch-action: none; cursor: default;" : ""}
        onpointerenter={isUsed ? (e) => showTooltip(e, cell) : undefined}
        onpointerleave={isUsed
          ? (e) => {
              if (e.pointerType === "mouse") hideTooltip()
            }
          : undefined}
      >
        {#if cell.shape === "circle"}
          <circle
            cx={cell.cx}
            cy={cell.cy}
            r={CIRCLE_R}
            fill={fillColor}
            stroke={strokeColor}
            stroke-width={strokeWidth}
          />
        {:else}
          <rect
            x={cell.cx - SQUARE_HALF}
            y={cell.cy - SQUARE_HALF}
            width={SQUARE_HALF * 2}
            height={SQUARE_HALF * 2}
            fill={fillColor}
            stroke={strokeColor}
            stroke-width={strokeWidth}
          />
        {/if}
        <text
          x={cell.cx}
          y={cell.cy}
          text-anchor="middle"
          dominant-baseline="central"
          font-size="9"
          fill={labelFill}
          style="pointer-events: none; user-select: none;">{cell.label}</text
        >
      </g>
    {/each}
  </svg>

  {#if tooltip.visible}
    {@const tx = tooltip.x + 12}
    {@const ty = tooltip.y - (tooltip.colors.length * 26 + 8) / 2}
    <div class="tooltip" style="left: {tx}px; top: {ty}px;" role="tooltip">
      {#each tooltip.colors as c (c.notation)}
        <div class="tooltip-row">
          <span class="tooltip-swatch" style="background: {c.hex};"></span>
          <span class="tooltip-notation">{c.notation}</span>
          <span class="tooltip-hex">{c.hex}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .diagram-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip {
    position: absolute;
    background: var(--color-text, #111);
    color: #fff;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tooltip-swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }

  .tooltip-notation {
    font-family: monospace;
    font-weight: 600;
  }

  .tooltip-hex {
    color: rgba(255, 255, 255, 0.7);
    font-family: monospace;
  }
</style>
