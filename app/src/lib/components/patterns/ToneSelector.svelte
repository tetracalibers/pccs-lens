<script lang="ts">
  import { lookupPCCSColor, GRAY_SUB_TONES } from "$lib/patterns/lookup"
  import type { PCCSColor } from "$lib/data/types"

  let {
    value,
    selectedHue,
    suggestedTones,
    allowedTones,
    onselect
  }: {
    value: string
    selectedHue: number | null
    suggestedTones: string[]
    allowedTones: string[]
    onselect: (tone: string) => void
  } = $props()

  type ToneCell = {
    key: string
    label: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  // ToneDiagram と同一レイアウト定数
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

  const SVG_W = Math.ceil(X4 + CIRCLE_R + PAD)
  const SVG_H = Math.ceil(Y0 + 4 * ROW_STEP + RECT_H / 2 + PAD)

  const CELLS: ToneCell[] = [
    { key: "W", label: "W", cx: X0, cy: Y0 + S * 0, shape: "square" },
    { key: "ltGy", label: "ltGy", cx: X0, cy: Y0 + S * 1, shape: "square" },
    { key: "mGy", label: "mGy", cx: X0, cy: Y0 + S * 2, shape: "square" },
    { key: "dkGy", label: "dkGy", cx: X0, cy: Y0 + S * 3, shape: "square" },
    { key: "Bk", label: "Bk", cx: X0, cy: Y0 + S * 4, shape: "square" },
    { key: "p", label: "p", cx: X1, cy: Y0 + S * 0.5, shape: "circle" },
    { key: "ltg", label: "ltg", cx: X1, cy: Y0 + S * 1.5, shape: "circle" },
    { key: "g", label: "g", cx: X1, cy: Y0 + S * 2.5, shape: "circle" },
    { key: "dkg", label: "dkg", cx: X1, cy: Y0 + S * 3.5, shape: "circle" },
    { key: "lt", label: "lt", cx: X2, cy: Y0 + S * 0.5, shape: "circle" },
    { key: "sf", label: "sf", cx: X2, cy: Y0 + S * 1.5, shape: "circle" },
    { key: "d", label: "d", cx: X2, cy: Y0 + S * 2.5, shape: "circle" },
    { key: "dk", label: "dk", cx: X2, cy: Y0 + S * 3.5, shape: "circle" },
    { key: "b", label: "b", cx: X3, cy: Y0 + S * 1, shape: "circle" },
    { key: "s", label: "s", cx: X3, cy: Y0 + S * 2, shape: "circle" },
    { key: "dp", label: "dp", cx: X3, cy: Y0 + S * 3, shape: "circle" },
    { key: "v", label: "v", cx: X4, cy: Y0 + S * 2, shape: "circle" }
  ]

  // 無彩色セルのHEX
  const ACHROMATIC_HEX: Record<string, string> = {
    W: "#ffffff",
    ltGy: "#c8c8c8",
    mGy: "#888888",
    dkGy: "#555555",
    Bk: "#1a1a1a"
  }

  // ツールチップ表示中のグレイキー
  let hoveredGrayKey: string | null = $state(null)

  // 現在のvalueがGy-X.X形式の場合、親バケットキーを特定
  function getGrayParentKey(tone: string): string | null {
    if (!tone.startsWith("Gy-")) return null
    for (const [bucket, tones] of Object.entries(GRAY_SUB_TONES)) {
      if (tones.some((t: PCCSColor) => t.notation === tone)) return bucket
    }
    return null
  }

  const selectedParentKey = $derived(getGrayParentKey(value))

  const suggestedSet = $derived(new Set(suggestedTones))
  const allowedSet = $derived(new Set(allowedTones))

  function getOpacity(key: string): number {
    if (isSelected(key)) return 1
    if (suggestedSet.has(key)) return 1
    if (allowedSet.has(key)) return 0.55
    return 0.2
  }

  function isSelected(key: string): boolean {
    if (value === key) return true
    // Gy-X.X選択時は親バケットセルを選択状態とする
    if (selectedParentKey === key) return true
    return false
  }

  function isSuggested(key: string): boolean {
    return suggestedSet.has(key)
  }

  // セルの塗りつぶし色
  function getFillColor(cell: ToneCell): string {
    // 無彩色セル
    if (cell.key in ACHROMATIC_HEX) {
      // Gy-X.X選択時は親セルにそのグレイの色を反映
      if (selectedParentKey === cell.key) {
        return lookupPCCSColor(null, value)?.hex ?? ACHROMATIC_HEX[cell.key]
      }
      return ACHROMATIC_HEX[cell.key]
    }
    // 有彩色セル: selectedHue があればその色相の色を表示
    if (selectedHue !== null) {
      return lookupPCCSColor(selectedHue, cell.key)?.hex ?? "#e0e0e0"
    }
    return "#e0e0e0"
  }

  function getStrokeColor(cell: ToneCell): string {
    if (isSelected(cell.key)) return "#333"
    if (isSuggested(cell.key)) return "#999"
    return "#ddd"
  }

  function getStrokeWidth(cell: ToneCell): number {
    return isSelected(cell.key) ? 2.5 : isSuggested(cell.key) ? 1.5 : 1
  }

  function labelFillFromHex(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return brightness > 0.5 ? "#444" : "#ccc"
  }

  function getLabelFill(cell: ToneCell): string {
    return labelFillFromHex(getFillColor(cell))
  }

  // ツールチップのレイアウト定数
  const TIP_ITEM_W = 48
  const TIP_ITEM_H = 22
  const TIP_GAP = 3
  const TIP_PAD = 4
  const TIP_OFFSET_X = 8 // セルとの水平間隔

  function getTooltipItems(bucketKey: string): PCCSColor[] {
    return GRAY_SUB_TONES[bucketKey] ?? []
  }

  function getTooltipX(cell: ToneCell): number {
    return cell.cx - RECT_W / 2 - TIP_OFFSET_X - TIP_ITEM_W - TIP_PAD * 2
  }

  function getTooltipY(cell: ToneCell, itemCount: number): number {
    const totalH = itemCount * TIP_ITEM_H + (itemCount - 1) * TIP_GAP + TIP_PAD * 2
    return cell.cy - totalH / 2
  }
</script>

<svg
  viewBox="0 0 {SVG_W} {SVG_H}"
  role="group"
  aria-label="トーン選択"
  style="width: 100%; cursor: pointer; overflow: visible;"
>
  {#each CELLS as cell (cell.key)}
    {@const opacity = getOpacity(cell.key)}
    {@const selected = isSelected(cell.key)}
    {@const suggested = isSuggested(cell.key)}
    {@const isGrayBucket = cell.key === "ltGy" || cell.key === "mGy" || cell.key === "dkGy"}
    <g
      {opacity}
      role="button"
      aria-label={cell.label}
      aria-pressed={selected}
      tabindex="0"
      style="cursor: pointer;"
      onclick={() => onselect(cell.key)}
      onkeydown={(e) => e.key === "Enter" && onselect(cell.key)}
      onmouseenter={() => isGrayBucket && (hoveredGrayKey = cell.key)}
      onmouseleave={() => isGrayBucket && hoveredGrayKey === cell.key && (hoveredGrayKey = null)}
    >
      {#if cell.shape === "circle"}
        <circle
          cx={cell.cx}
          cy={cell.cy}
          r={CIRCLE_R}
          fill={getFillColor(cell)}
          stroke={getStrokeColor(cell)}
          stroke-width={getStrokeWidth(cell)}
        />
      {:else}
        <rect
          x={cell.cx - RECT_W / 2}
          y={cell.cy - RECT_H / 2}
          width={RECT_W}
          height={RECT_H}
          rx="3"
          fill={getFillColor(cell)}
          stroke={getStrokeColor(cell)}
          stroke-width={getStrokeWidth(cell)}
        />
      {/if}

      <!-- 選択中インジケータ（外枠リング） -->
      {#if selected}
        {#if cell.shape === "circle"}
          <circle
            cx={cell.cx}
            cy={cell.cy}
            r={CIRCLE_R + 4}
            fill="none"
            stroke="#333"
            stroke-width="1.5"
            stroke-dasharray="3 2"
            style="pointer-events: none;"
          />
        {:else}
          <rect
            x={cell.cx - RECT_W / 2 - 4}
            y={cell.cy - RECT_H / 2 - 4}
            width={RECT_W + 8}
            height={RECT_H + 8}
            rx="5"
            fill="none"
            stroke="#333"
            stroke-width="1.5"
            stroke-dasharray="3 2"
            style="pointer-events: none;"
          />
        {/if}
      {/if}

      <!-- サジェストマーカー -->
      {#if suggested && !selected}
        <circle
          cx={cell.cx + (cell.shape === "circle" ? CIRCLE_R - 5 : RECT_W / 2 - 5)}
          cy={cell.cy - (cell.shape === "circle" ? CIRCLE_R - 5 : RECT_H / 2 - 5)}
          r="4"
          fill="#f59e0b"
          style="pointer-events: none;"
        />
      {/if}

      <text
        x={cell.cx}
        y={cell.cy}
        text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--font-mono)"
        font-size={selected || suggested ? 11 : 10}
        font-weight={selected ? "bold" : "normal"}
        style={`pointer-events: none; user-select: none; fill: ${getLabelFill(cell)};`}
      >
        {cell.label}
      </text>
    </g>
  {/each}

  <!-- グレイ細分ツールチップ -->
  {#if hoveredGrayKey}
    {@const hoverCell = CELLS.find((c) => c.key === hoveredGrayKey)}
    {#if hoverCell}
      {@const items = getTooltipItems(hoveredGrayKey)}
      {@const tipX = getTooltipX(hoverCell)}
      {@const tipY = getTooltipY(hoverCell, items.length)}
      {@const tipH = items.length * TIP_ITEM_H + (items.length - 1) * TIP_GAP + TIP_PAD * 2}
      {@const tipW = TIP_ITEM_W + TIP_PAD * 2}
      <g
        role="group"
        aria-label="グレイ細分選択"
        style="cursor: default;"
        onmouseenter={() => (hoveredGrayKey = hoveredGrayKey)}
        onmouseleave={() => (hoveredGrayKey = null)}
      >
        <!-- 背景 -->
        <rect
          x={tipX}
          y={tipY}
          width={tipW}
          height={tipH}
          rx="4"
          fill="white"
          stroke="#ccc"
          stroke-width="1"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.15))"
        />
        {#each items as subTone, i (subTone.notation)}
          {@const itemY = tipY + TIP_PAD + i * (TIP_ITEM_H + TIP_GAP)}
          {@const isSubSelected = value === subTone.notation}
          {@const subLabelFill = labelFillFromHex(subTone.hex)}
          <g
            role="button"
            aria-label={subTone.notation}
            aria-pressed={isSubSelected}
            tabindex="0"
            style="cursor: pointer;"
            onclick={(e) => {
              e.stopPropagation()
              onselect(subTone.notation)
            }}
            onkeydown={(e) => e.key === "Enter" && onselect(subTone.notation)}
          >
            <rect
              x={tipX + TIP_PAD}
              y={itemY}
              width={TIP_ITEM_W}
              height={TIP_ITEM_H}
              rx="3"
              fill={subTone.hex}
              stroke={isSubSelected ? "#333" : "#ddd"}
              stroke-width={isSubSelected ? 2 : 1}
            />
            {#if isSubSelected}
              <rect
                x={tipX + TIP_PAD - 2}
                y={itemY - 2}
                width={TIP_ITEM_W + 4}
                height={TIP_ITEM_H + 4}
                rx="4"
                fill="none"
                stroke="#333"
                stroke-width="1.5"
                stroke-dasharray="3 2"
                style="pointer-events: none;"
              />
            {/if}
            <text
              x={tipX + TIP_PAD + TIP_ITEM_W / 2}
              y={itemY + TIP_ITEM_H / 2}
              text-anchor="middle"
              dominant-baseline="central"
              font-family="var(--font-mono)"
              font-size="9"
              font-weight={isSubSelected ? "bold" : "normal"}
              style={`pointer-events: none; user-select: none; fill: ${subLabelFill};`}
            >
              {subTone.notation}
            </text>
          </g>
        {/each}
      </g>
    {/if}
  {/if}
</svg>
