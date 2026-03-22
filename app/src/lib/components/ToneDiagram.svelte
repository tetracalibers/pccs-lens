<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"

  let {
    displayedPCCSList,
    isCard199
  }: {
    displayedPCCSList: PCCSColor[]
    isCard199: boolean
  } = $props()

  type ToneCell = {
    key: string
    label: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  // --- セルサイズ ---
  const CIRCLE_R = 20
  const RECT_W = 45
  const RECT_H = 36

  // --- 間隔調整用定数 ---
  const ROW_STEP = 46 // Col0 の隣接セル中心間の縦距離（縦の間隔）
  const COL_GAP = 8 // 有彩色列間のセル端-端の横距離（横の間隔）
  const COL_GAP_ACH = 12 // 無彩色列と有彩色1列目の端-端の横距離

  // --- 導出座標 ---
  const PAD = 4
  const X0 = PAD + RECT_W / 2
  const X1 = X0 + RECT_W / 2 + COL_GAP_ACH + CIRCLE_R
  const X2 = X1 + 2 * CIRCLE_R + COL_GAP
  const X3 = X2 + 2 * CIRCLE_R + COL_GAP
  const X4 = X3 + 2 * CIRCLE_R + COL_GAP
  const Y0 = PAD + RECT_H / 2 // 最上段 Col0 セルの中心 y

  const SVG_W = Math.ceil(X4 + CIRCLE_R + PAD)
  const SVG_H = Math.ceil(Y0 + 4 * ROW_STEP + RECT_H / 2 + PAD)

  // --- staggered midpoint 配置 ---
  // Col0: Y0, Y0+S, Y0+2S, Y0+3S, Y0+4S
  // Col1/2: midpoints of Col0 pairs → Y0+S/2, Y0+3S/2, Y0+5S/2, Y0+7S/2
  // Col3: midpoints of Col1 pairs → Y0+S, Y0+2S, Y0+3S
  // Col4: Y0+2S (same as Col3 middle)
  const S = ROW_STEP
  const CELLS: ToneCell[] = [
    // Col0: achromatic squares
    { key: "W", label: "W", cx: X0, cy: Y0 + S * 0, shape: "square" },
    { key: "ltGy", label: "ltGy", cx: X0, cy: Y0 + S * 1, shape: "square" },
    { key: "mGy", label: "mGy", cx: X0, cy: Y0 + S * 2, shape: "square" },
    { key: "dkGy", label: "dkGy", cx: X0, cy: Y0 + S * 3, shape: "square" },
    { key: "Bk", label: "Bk", cx: X0, cy: Y0 + S * 4, shape: "square" },
    // Col1: p/ltg/g/dkg
    { key: "p", label: "p", cx: X1, cy: Y0 + S * 0.5, shape: "circle" },
    { key: "ltg", label: "ltg", cx: X1, cy: Y0 + S * 1.5, shape: "circle" },
    { key: "g", label: "g", cx: X1, cy: Y0 + S * 2.5, shape: "circle" },
    { key: "dkg", label: "dkg", cx: X1, cy: Y0 + S * 3.5, shape: "circle" },
    // Col2: lt/sf/d/dk
    { key: "lt", label: "lt", cx: X2, cy: Y0 + S * 0.5, shape: "circle" },
    { key: "sf", label: "sf", cx: X2, cy: Y0 + S * 1.5, shape: "circle" },
    { key: "d", label: "d", cx: X2, cy: Y0 + S * 2.5, shape: "circle" },
    { key: "dk", label: "dk", cx: X2, cy: Y0 + S * 3.5, shape: "circle" },
    // Col3: b/s/dp
    { key: "b", label: "b", cx: X3, cy: Y0 + S * 1, shape: "circle" },
    { key: "s", label: "s", cx: X3, cy: Y0 + S * 2, shape: "circle" },
    { key: "dp", label: "dp", cx: X3, cy: Y0 + S * 3, shape: "circle" },
    // Col4: v
    { key: "v", label: "v", cx: X4, cy: Y0 + S * 2, shape: "circle" }
  ]

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
    anchorX: number
    anchorY: number
    colors: PCCSColor[]
  }

  let tooltip: TooltipState = $state({ visible: false, anchorX: 0, anchorY: 0, colors: [] })
  let wrapperEl: HTMLDivElement | undefined = $state()
  let svgEl: SVGSVGElement | undefined = $state()

  function showTooltip(_e: PointerEvent, cell: ToneCell) {
    const usedColors = getUsedColors(cell)
    if (usedColors.length === 0) return
    const wrapperRect = wrapperEl!.getBoundingClientRect()
    const svgRect = svgEl!.getBoundingClientRect()
    const scaleX = svgRect.width / SVG_W
    const scaleY = svgRect.height / SVG_H
    const cellTopSvg = cell.shape === "circle" ? cell.cy - CIRCLE_R : cell.cy - RECT_H / 2
    const anchorX = svgRect.left - wrapperRect.left + cell.cx * scaleX
    const anchorY = svgRect.top - wrapperRect.top + cellTopSvg * scaleY
    tooltip = {
      visible: true,
      anchorX,
      anchorY,
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
  <svg viewBox="0 0 {SVG_W} {SVG_H}" role="img" aria-label="PCCSトーン概念図" bind:this={svgEl}>
    <defs>
      <pattern
        id="hatch"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="8" stroke="#bbb" stroke-width="1" />
      </pattern>
    </defs>

    {#each cellData as cell (cell.key)}
      {@const isUsed = cell.usedColors.length > 0}
      {@const isSCell = cell.key === "s"}
      {@const showHatch = isSCell && isCard199 && !isUsed}
      {@const fillColor = isUsed ? cell.usedColors[0].hex : showHatch ? "url(#hatch)" : "white"}
      {@const strokeColor = isUsed
        ? `oklch(from ${cell.usedColors[0].hex} calc(l * .85) c h)`
        : "#ccc"}
      {@const strokeWidth = isUsed ? 1.5 : 1}
      {@const labelFill = isUsed
        ? isLightColor(cell.usedColors[0].hex)
          ? `oklch(from ${cell.usedColors[0].hex} calc(l - .60) c h)`
          : `oklch(from ${cell.usedColors[0].hex} calc(l + .60) c h);`
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
            x={cell.cx - RECT_W / 2}
            y={cell.cy - RECT_H / 2}
            width={RECT_W}
            height={RECT_H}
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
          font-family="var(--font-mono)"
          font-size={isUsed ? 11 : 10}
          style={`pointer-events: none; user-select: none; fill: ${labelFill};`}
        >
          {cell.label}
        </text>
      </g>
    {/each}
  </svg>

  {#if tooltip.visible}
    <div
      class="tooltip"
      style="left: {tooltip.anchorX}px; top: {tooltip.anchorY}px;"
      role="tooltip"
    >
      {#each tooltip.colors as c, i (i)}
        <div class="tooltip-row">
          <span class="tooltip-swatch" style="background: {c.hex};"></span>
          <span class="tooltip-notation">{c.notation}</span>
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
    transform: translateX(-50%) translateY(calc(-100% - 8px));
  }

  .tooltip::after {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--color-text, #111);
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
    font-family: var(--font-mono);
    font-weight: 600;
  }
</style>
