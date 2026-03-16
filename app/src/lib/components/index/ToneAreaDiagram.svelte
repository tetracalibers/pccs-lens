<script lang="ts">
  import colorsFullData from "$lib/data/pccs_colors_full.json"

  let { highlights = [] }: { highlights: string[] } = $props()

  type ToneCell = {
    key: string
    label: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  // --- セルサイズ（ToneDiagram.svelte と同じ定数）---
  const CIRCLE_R = 20
  const RECT_W = 45
  const RECT_H = 36

  const ROW_STEP = 46
  const COL_GAP = 8
  const COL_GAP_ACH = 12

  const PAD = 4
  const X0 = PAD + RECT_W / 2
  const X1 = X0 + RECT_W / 2 + COL_GAP_ACH + CIRCLE_R
  const X2 = X1 + 2 * CIRCLE_R + COL_GAP
  const X3 = X2 + 2 * CIRCLE_R + COL_GAP
  const X4 = X3 + 2 * CIRCLE_R + COL_GAP
  const Y0 = PAD + RECT_H / 2

  const S = ROW_STEP

  // 軸表示用の余白
  const AXIS_PAD = 48

  const CELLS_SVG_W = Math.ceil(X4 + CIRCLE_R + PAD)
  const CELLS_SVG_H = Math.ceil(Y0 + 4 * S + RECT_H / 2 + PAD)

  // 軸を含む全体 SVG サイズ
  const OX = AXIS_PAD // セル群の原点オフセット（x）
  const OY = 0 // セル群の原点オフセット（y）
  const SVG_W = CELLS_SVG_W + AXIS_PAD
  const SVG_H = CELLS_SVG_H + AXIS_PAD

  const CELLS: ToneCell[] = [
    // Col0: achromatic squares
    { key: "W", label: "W", cx: OX + X0, cy: OY + Y0 + S * 0, shape: "square" },
    { key: "ltGy", label: "ltGy", cx: OX + X0, cy: OY + Y0 + S * 1, shape: "square" },
    { key: "mGy", label: "mGy", cx: OX + X0, cy: OY + Y0 + S * 2, shape: "square" },
    { key: "dkGy", label: "dkGy", cx: OX + X0, cy: OY + Y0 + S * 3, shape: "square" },
    { key: "Bk", label: "Bk", cx: OX + X0, cy: OY + Y0 + S * 4, shape: "square" },
    // Col1: p/ltg/g/dkg
    { key: "p", label: "p", cx: OX + X1, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "ltg", label: "ltg", cx: OX + X1, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "g", label: "g", cx: OX + X1, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dkg", label: "dkg", cx: OX + X1, cy: OY + Y0 + S * 3.5, shape: "circle" },
    // Col2: lt/sf/d/dk
    { key: "lt", label: "lt", cx: OX + X2, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "sf", label: "sf", cx: OX + X2, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "d", label: "d", cx: OX + X2, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dk", label: "dk", cx: OX + X2, cy: OY + Y0 + S * 3.5, shape: "circle" },
    // Col3: b/s/dp
    { key: "b", label: "b", cx: OX + X3, cy: OY + Y0 + S * 1, shape: "circle" },
    { key: "s", label: "s", cx: OX + X3, cy: OY + Y0 + S * 2, shape: "circle" },
    { key: "dp", label: "dp", cx: OX + X3, cy: OY + Y0 + S * 3, shape: "circle" },
    // Col4: v
    { key: "v", label: "v", cx: OX + X4, cy: OY + Y0 + S * 2, shape: "circle" }
  ]

  // highlights 判定: "Gy" は ltGy/mGy/dkGy にマッチ
  function isHighlighted(cell: ToneCell): boolean {
    if (cell.key === "ltGy" || cell.key === "mGy" || cell.key === "dkGy") {
      return highlights.includes("Gy")
    }
    return highlights.includes(cell.key)
  }

  // ハイライトセルの fill 色
  // chromatic: pccs_colors_full.json の {toneSymbol}12 の hex
  // achromatic: 固定色
  const ACHROMATIC_FILLS: Record<string, string> = {
    W: "#f1f1f1",
    ltGy: "#C8C8C8",
    mGy: "#797979",
    dkGy: "#4A4A4A",
    Bk: "#252525"
  }

  function getHighlightFill(cell: ToneCell): string {
    if (cell.shape === "square") {
      return ACHROMATIC_FILLS[cell.key] ?? "#999"
    }
    const entry = colorsFullData.find((c) => c.toneSymbol === cell.key && c.hueNumber === 24)
    return entry?.hex ?? "#ccc"
  }

  // テキスト色（明度判定）
  function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
  }

  // セル群の境界座標
  const CELLS_LEFT = OX + X0 - RECT_W / 2
  const CELLS_RIGHT = OX + X4 + CIRCLE_R
  const CELLS_TOP = OY + Y0 - RECT_H / 2
  const CELLS_BOTTOM = OY + Y0 + S * 4 + RECT_H / 2

  // --- 軸レイアウト定数 ---
  const AXIS_GAP = 12 // セル境界 ↔ 軸線の隙間
  const H_LABEL_GAP = 22 // 横軸線からラベルまでの距離（下方向）
  const V_TITLE_OFFSET = 22 // 縦軸線から「明度」タイトル中心までの距離（左方向）

  // 軸線座標
  const H_AXIS_Y = CELLS_BOTTOM + AXIS_GAP
  const H_AXIS_X1 = CELLS_LEFT
  const H_AXIS_X2 = CELLS_RIGHT

  const V_AXIS_X = CELLS_LEFT - AXIS_GAP
  const V_AXIS_Y1 = CELLS_BOTTOM
  const V_AXIS_Y2 = CELLS_TOP

  // ラベル座標
  const H_LABEL_Y = H_AXIS_Y + H_LABEL_GAP
  const V_TITLE_X = V_AXIS_X - V_TITLE_OFFSET
</script>

<div class="diagram-wrapper">
  <svg viewBox="0 0 {SVG_W} {SVG_H}" role="img" aria-label="PCCSトーン概念図（ハイライト付き）">
    <!-- 軸（彩度・明度） -->
    <defs>
      <marker
        id="arr-axis-area"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="4.6"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <polyline points="0,0 8,4.6 0,9.2" fill="none" stroke="#aaa" stroke-width="1.5" />
      </marker>
    </defs>

    <!-- 横軸（彩度） -->
    <line
      x1={H_AXIS_X1}
      y1={H_AXIS_Y}
      x2={H_AXIS_X2}
      y2={H_AXIS_Y}
      stroke="#aaa"
      stroke-width="1.5"
      marker-end="url(#arr-axis-area)"
    />
    <text
      x={(H_AXIS_X1 + H_AXIS_X2) / 2}
      y={H_LABEL_Y}
      text-anchor="middle"
      font-size="11"
      fill="oklch(from #aaa calc(l * 0.65) c h)"
    >
      彩度
    </text>

    <!-- 縦軸（明度） -->
    <line
      x1={V_AXIS_X}
      y1={V_AXIS_Y1}
      x2={V_AXIS_X}
      y2={V_AXIS_Y2}
      stroke="#aaa"
      stroke-width="1.5"
      marker-end="url(#arr-axis-area)"
    />
    <text
      x={V_TITLE_X}
      y={(V_AXIS_Y1 + V_AXIS_Y2) / 2}
      text-anchor="middle"
      font-size="11"
      fill="oklch(from #aaa calc(l * 0.75) c h)"
    >
      明度
    </text>

    <!-- トーンセル -->
    {#each CELLS as cell (cell.key)}
      {@const highlighted = isHighlighted(cell)}
      {@const fillColor = getHighlightFill(cell)}
      {@const strokeColor = `oklch(from ${fillColor} calc(l * .85) c h)`}
      {@const cellOpacity = highlighted ? 1 : 0.08}
      {@const labelFill = isLightColor(fillColor) ? "#333" : "#fff"}

      <g opacity={cellOpacity}>
        {#if cell.shape === "circle"}
          <circle
            cx={cell.cx}
            cy={cell.cy}
            r={CIRCLE_R}
            fill={fillColor}
            stroke={strokeColor}
            stroke-width="1"
          />
        {:else}
          <rect
            x={cell.cx - RECT_W / 2}
            y={cell.cy - RECT_H / 2}
            width={RECT_W}
            height={RECT_H}
            fill={fillColor}
            stroke={strokeColor}
            stroke-width="1"
          />
        {/if}
        <text
          x={cell.cx}
          y={cell.cy}
          text-anchor="middle"
          dominant-baseline="central"
          font-family="var(--font-mono)"
          font-size="10"
          style="pointer-events: none; user-select: none; fill: {labelFill};"
        >
          {cell.label}
        </text>
      </g>
    {/each}
  </svg>
</div>

<style>
  .diagram-wrapper {
    display: flex;
    width: 100%;
    max-width: 320px;
  }

  svg {
    width: 100%;
    height: auto;
  }
</style>
