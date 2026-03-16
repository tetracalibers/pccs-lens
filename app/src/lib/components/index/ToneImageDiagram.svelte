<script lang="ts">
  import { SvelteMap } from "svelte/reactivity"
  import colorsFullData from "$lib/data/pccs_colors_full.json"
  import toneData from "$lib/data/pccs_tone.json"

  // --- セルサイズ定数 ---
  const PIE_OUTER_R = 36
  const PIE_INNER_R = 15
  const LABEL_R = 44
  const CELL_R = 50
  const RECT_W = 90
  const RECT_H = 60
  const ROW_STEP = 108
  const COL_GAP = 14
  const COL_GAP_ACH = 20

  // --- 軸用パディング ---
  const AXIS_PAD = 32
  const PAD = 8

  // --- 座標導出 ---
  const X0 = PAD + RECT_W / 2
  const X1 = X0 + RECT_W / 2 + COL_GAP_ACH + CELL_R
  const X2 = X1 + 2 * CELL_R + COL_GAP
  const X3 = X2 + 2 * CELL_R + COL_GAP
  const X4 = X3 + 2 * CELL_R + COL_GAP
  const Y0 = PAD + RECT_H / 2
  const S = ROW_STEP

  // オフセット（縦軸用余白を左に確保）
  const OX = AXIS_PAD
  const OY = 0

  const CELLS_SVG_W = Math.ceil(X4 + CELL_R + PAD)
  const CELLS_SVG_H = Math.ceil(Y0 + 4 * S + RECT_H / 2 + PAD)
  const SVG_W = CELLS_SVG_W + AXIS_PAD
  const SVG_H = CELLS_SVG_H + AXIS_PAD

  type ToneCell = {
    key: string
    toneSymbol: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  const CELLS: ToneCell[] = [
    { key: "W", toneSymbol: "W", cx: OX + X0, cy: OY + Y0 + S * 0, shape: "square" },
    { key: "ltGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 1, shape: "square" },
    { key: "mGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 2, shape: "square" },
    { key: "dkGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 3, shape: "square" },
    { key: "Bk", toneSymbol: "Bk", cx: OX + X0, cy: OY + Y0 + S * 4, shape: "square" },
    { key: "p", toneSymbol: "p", cx: OX + X1, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "ltg", toneSymbol: "ltg", cx: OX + X1, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "g", toneSymbol: "g", cx: OX + X1, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dkg", toneSymbol: "dkg", cx: OX + X1, cy: OY + Y0 + S * 3.5, shape: "circle" },
    { key: "lt", toneSymbol: "lt", cx: OX + X2, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "sf", toneSymbol: "sf", cx: OX + X2, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "d", toneSymbol: "d", cx: OX + X2, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dk", toneSymbol: "dk", cx: OX + X2, cy: OY + Y0 + S * 3.5, shape: "circle" },
    { key: "b", toneSymbol: "b", cx: OX + X3, cy: OY + Y0 + S * 1, shape: "circle" },
    { key: "s", toneSymbol: "s", cx: OX + X3, cy: OY + Y0 + S * 2, shape: "circle" },
    { key: "dp", toneSymbol: "dp", cx: OX + X3, cy: OY + Y0 + S * 3, shape: "circle" },
    { key: "v", toneSymbol: "v", cx: OX + X4, cy: OY + Y0 + S * 2, shape: "circle" }
  ]

  // 偶数色相番号 (2, 4, ..., 24)
  const EVEN_HUES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

  // toneSymbol × hueNumber → hex のマップ
  const colorMap = new SvelteMap<string, string>()
  for (const c of colorsFullData) {
    if (c.toneSymbol && c.hueNumber) {
      colorMap.set(`${c.toneSymbol}:${c.hueNumber}`, c.hex)
    }
  }

  // トーン情報 map
  const toneMap = new SvelteMap(toneData.map((t) => [t.toneSymbol, t]))

  // 無彩色の背景色
  const ACHROMATIC_BG: Record<string, string> = {
    W: "#f1f1f1",
    ltGy: "#D0D0D0",
    mGy: "#797979",
    dkGy: "#4A4A4A",
    Bk: "#252525"
  }

  function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
  }

  // SVG パイスライスパスを生成
  function pieSlicePath(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startDeg: number,
    endDeg: number
  ): string {
    const toRad = (d: number) => (d * Math.PI) / 180
    const sx = cx + outerR * Math.cos(toRad(startDeg))
    const sy = cy + outerR * Math.sin(toRad(startDeg))
    const ex = cx + outerR * Math.cos(toRad(endDeg))
    const ey = cy + outerR * Math.sin(toRad(endDeg))
    const ix = cx + innerR * Math.cos(toRad(endDeg))
    const iy = cy + innerR * Math.sin(toRad(endDeg))
    const ix2 = cx + innerR * Math.cos(toRad(startDeg))
    const iy2 = cy + innerR * Math.sin(toRad(startDeg))
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return [
      `M ${sx} ${sy}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ex} ${ey}`,
      `L ${ix} ${iy}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      `Z`
    ].join(" ")
  }

  // ラベル座標
  function labelPos(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  // ツールチップ
  type TooltipState = {
    visible: boolean
    x: number
    y: number
    feelings: string[]
  }

  let tooltip: TooltipState = $state({ visible: false, x: 0, y: 0, feelings: [] })
  let wrapperEl: HTMLDivElement | undefined = $state()
  let svgEl: SVGSVGElement | undefined = $state()

  function showTooltip(e: PointerEvent, cell: ToneCell) {
    const tone = toneMap.get(cell.toneSymbol)
    if (!tone || !wrapperEl || !svgEl) return
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const svgRect = svgEl.getBoundingClientRect()
    const scaleX = svgRect.width / SVG_W
    const scaleY = svgRect.height / SVG_H
    const cellTopSvg = cell.shape === "circle" ? cell.cy - PIE_OUTER_R - 4 : cell.cy - RECT_H / 2
    const anchorX = svgRect.left - wrapperRect.left + cell.cx * scaleX
    const anchorY = svgRect.top - wrapperRect.top + cellTopSvg * scaleY
    tooltip = { visible: true, x: anchorX, y: anchorY, feelings: tone.feelings }
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

  // 軸座標
  const CELLS_LEFT = OX + X0 - RECT_W / 2
  const CELLS_RIGHT = OX + X4 + CELL_R
  const CELLS_TOP = OY + Y0 - RECT_H / 2
  const CELLS_BOTTOM = OY + Y0 + 4 * S + RECT_H / 2

  const H_AXIS_Y = SVG_H - AXIS_PAD / 2
  const H_AXIS_X1 = CELLS_LEFT
  const H_AXIS_X2 = CELLS_RIGHT

  const V_AXIS_X = AXIS_PAD / 2
  const V_AXIS_Y1 = CELLS_BOTTOM
  const V_AXIS_Y2 = CELLS_TOP
</script>

<div class="diagram-wrapper" bind:this={wrapperEl}>
  <svg viewBox="0 0 {SVG_W} {SVG_H}" role="img" aria-label="PCCSトーン概念図" bind:this={svgEl}>
    <defs>
      <marker id="arr-h-img" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#aaa" />
      </marker>
      <marker id="arr-v-img" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
        <path d="M0,6 L6,6 L3,0 z" fill="#aaa" />
      </marker>
    </defs>

    <!-- 横軸（彩度） -->
    <line
      x1={H_AXIS_X1}
      y1={H_AXIS_Y}
      x2={H_AXIS_X2}
      y2={H_AXIS_Y}
      stroke="#aaa"
      stroke-width="1"
      marker-end="url(#arr-h-img)"
    />
    <text
      x={H_AXIS_X1 - 2}
      y={H_AXIS_Y}
      text-anchor="end"
      dominant-baseline="central"
      font-size="10"
      fill="#aaa"
    >
      薄い
    </text>
    <text
      x={(H_AXIS_X1 + H_AXIS_X2) / 2}
      y={H_AXIS_Y + 12}
      text-anchor="middle"
      font-size="10"
      fill="#aaa"
    >
      彩度
    </text>
    <text
      x={H_AXIS_X2 + 6}
      y={H_AXIS_Y}
      text-anchor="start"
      dominant-baseline="central"
      font-size="10"
      fill="#aaa"
    >
      鮮やか
    </text>

    <!-- 縦軸（明度） -->
    <line
      x1={V_AXIS_X}
      y1={V_AXIS_Y1}
      x2={V_AXIS_X}
      y2={V_AXIS_Y2}
      stroke="#aaa"
      stroke-width="1"
      marker-end="url(#arr-v-img)"
    />
    <text x={V_AXIS_X} y={V_AXIS_Y1 + 12} text-anchor="middle" font-size="10" fill="#aaa">
      暗い
    </text>
    <text
      x={V_AXIS_X - 12}
      y={(V_AXIS_Y1 + V_AXIS_Y2) / 2}
      text-anchor="middle"
      font-size="10"
      fill="#aaa"
      transform="rotate(-90, {V_AXIS_X - 12}, {(V_AXIS_Y1 + V_AXIS_Y2) / 2})"
    >
      明度
    </text>
    <text x={V_AXIS_X} y={V_AXIS_Y2 - 10} text-anchor="middle" font-size="10" fill="#aaa">
      明るい
    </text>

    <!-- トーンセル -->
    {#each CELLS as cell (cell.key)}
      {@const tone = toneMap.get(cell.toneSymbol)}
      <g
        role="img"
        aria-label={tone ? `${cell.toneSymbol}: ${tone.feelings.join(", ")}` : cell.toneSymbol}
        style="touch-action: none; cursor: default;"
        onpointerenter={(e) => showTooltip(e, cell)}
        onpointerleave={(e) => {
          if (e.pointerType === "mouse") hideTooltip()
        }}
      >
        {#if cell.shape === "circle"}
          <!-- ドーナツ型パイチャート -->
          {#each EVEN_HUES as hue, i (hue)}
            {@const startDeg = -90 + i * 30}
            {@const endDeg = -90 + (i + 1) * 30}
            {@const hex = colorMap.get(`${cell.toneSymbol}:${hue}`) ?? "#ddd"}
            <path
              d={pieSlicePath(cell.cx, cell.cy, PIE_INNER_R, PIE_OUTER_R, startDeg, endDeg)}
              fill={hex}
              stroke="white"
              stroke-width="0.5"
            />
          {/each}
          <!-- 外周の色相番号ラベル -->
          {#each EVEN_HUES as hue, i (hue)}
            {@const midDeg = -90 + i * 30 + 15}
            {@const pos = labelPos(cell.cx, cell.cy, LABEL_R, midDeg)}
            <text
              x={pos.x}
              y={pos.y}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="8"
              fill="#555"
              style="pointer-events: none; user-select: none;"
            >
              {hue}
            </text>
          {/each}
          <!-- 中央テキスト -->
          <text
            x={cell.cx}
            y={cell.cy - 5}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-weight="bold"
            font-size="11"
            fill="#333"
            style="pointer-events: none; user-select: none;"
          >
            {cell.toneSymbol}
          </text>
          <text
            x={cell.cx}
            y={cell.cy + 6}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-size="8"
            fill="#555"
            style="pointer-events: none; user-select: none;"
          >
            {tone?.toneNameEn ?? ""}
          </text>
        {:else}
          <!-- 無彩色セル（矩形） -->
          {@const bg = ACHROMATIC_BG[cell.key] ?? "#999"}
          {@const textColor = isLightColor(bg) ? "#333" : "#fff"}
          <rect
            x={cell.cx - RECT_W / 2}
            y={cell.cy - RECT_H / 2}
            width={RECT_W}
            height={RECT_H}
            fill={bg}
            stroke="#ccc"
            stroke-width="1"
          />
          <text
            x={cell.cx}
            y={cell.cy - 8}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-weight="bold"
            font-size="13"
            fill={textColor}
            style="pointer-events: none; user-select: none;"
          >
            {cell.toneSymbol === "Gy" ? cell.key : cell.toneSymbol}
          </text>
          <text
            x={cell.cx}
            y={cell.cy + 8}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-size="10"
            fill={textColor}
            style="pointer-events: none; user-select: none;"
          >
            {tone?.toneNameEn ?? cell.key}
          </text>
        {/if}
      </g>
    {/each}
  </svg>

  {#if tooltip.visible}
    <div class="tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px;" role="tooltip">
      {tooltip.feelings.join("、")}
    </div>
  {/if}
</div>

<style>
  .diagram-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
    max-width: 640px;
  }

  svg {
    width: 100%;
    height: auto;
  }

  .tooltip {
    position: absolute;
    background: var(--color-text, #111);
    color: #fff;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 0.8rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
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
</style>
