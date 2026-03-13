<script lang="ts">
  import { lookupPCCSColor, GRAY_SUB_TONES } from "$lib/patterns/lookup"
  import type { PCCSColor } from "$lib/data/types"

  let {
    value,
    selectedHue,
    suggestedTones,
    onselect
  }: {
    value: string
    selectedHue: number | null
    suggestedTones: string[]
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

  // ツールチップを開いているグレイバケットキー
  let openTooltipKey: string | null = $state(null)
  let tooltipGroupEl: HTMLElement | null = $state(null)

  $effect(() => {
    if (!openTooltipKey) return
    const close = (e: MouseEvent) => {
      if (tooltipGroupEl?.contains(e.target as Node)) return
      openTooltipKey = null
    }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  })

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

  let focusedKey: string | null = $state(null)

  function getOpacity(key: string): number {
    if (isSelected(key)) return 1
    if (suggestedSet.has(key)) return 1
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

  function getTooltipItems(bucketKey: string): PCCSColor[] {
    return GRAY_SUB_TONES[bucketKey] ?? []
  }

  // インスタンスごとにユニークなIDを生成（複数配置時のアンカー名衝突を防ぐ）
  const instanceId = Math.random().toString(36).slice(2, 8)

  // CSS Anchor Positioning 用のアンカー名を生成
  function getAnchorName(key: string): string {
    return `--tone-selector-${instanceId}-${key}`
  }
</script>

<div class="tone-selector-root">
  <svg
    viewBox="0 0 {SVG_W} {SVG_H}"
    role="group"
    aria-label="トーン選択"
    style="width: 100%; overflow: visible;"
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
        style="cursor: pointer; outline: none;"
        onfocus={() => (focusedKey = cell.key)}
        onblur={() => (focusedKey = null)}
        onclick={(e) => {
          if (isGrayBucket) {
            e.stopPropagation()
            openTooltipKey = openTooltipKey === cell.key ? null : cell.key
          } else {
            onselect(cell.key)
          }
        }}
        onkeydown={(e) => {
          if (e.key === "Enter") {
            if (isGrayBucket) {
              openTooltipKey = openTooltipKey === cell.key ? null : cell.key
            } else {
              onselect(cell.key)
            }
          }
        }}
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

        <!-- フォーカスインジケータ -->
        {#if focusedKey === cell.key && !selected}
          {#if cell.shape === "circle"}
            <circle
              cx={cell.cx}
              cy={cell.cy}
              r={CIRCLE_R + 4}
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-dasharray="3 2"
              style="pointer-events: none;"
            />
            <circle
              cx={cell.cx}
              cy={cell.cy}
              r={CIRCLE_R + 4}
              fill="none"
              stroke="#3b82f6"
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
              stroke="white"
              stroke-width="2"
              stroke-dasharray="3 2"
              style="pointer-events: none;"
            />
            <rect
              x={cell.cx - RECT_W / 2 - 4}
              y={cell.cy - RECT_H / 2 - 4}
              width={RECT_W + 8}
              height={RECT_H + 8}
              rx="5"
              fill="none"
              stroke="#3b82f6"
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
  </svg>

  <!-- SVG g は anchor-name 非対応のため、グレイバケットセルに重なる不可視HTMLアンカーを絶対配置で設置 -->
  {#each CELLS as cell (cell.key)}
    {#if cell.key === "ltGy" || cell.key === "mGy" || cell.key === "dkGy"}
      <span
        class="cell-anchor"
        style="
          left: {((cell.cx - RECT_W / 2) / SVG_W) * 100}%;
          top: {((cell.cy - RECT_H / 2) / SVG_H) * 100}%;
          width: {(RECT_W / SVG_W) * 100}%;
          height: {(RECT_H / SVG_H) * 100}%;
          anchor-name: {getAnchorName(cell.key)};
        "
      ></span>
    {/if}
  {/each}

  <!-- グレイ細分ツールチップ（CSS Anchor Positioning で左右を自動切替） -->
  {#if openTooltipKey}
    {@const items = getTooltipItems(openTooltipKey)}
    <div
      class="gray-subtone-tooltip"
      style="position-anchor: {getAnchorName(openTooltipKey)};"
      bind:this={tooltipGroupEl}
      role="group"
      aria-label="グレイ細分選択"
    >
      {#each items as subTone (subTone.notation)}
        {@const isSubSelected = value === subTone.notation}
        <button
          class="subtone-item"
          class:selected={isSubSelected}
          style="background-color: {subTone.hex}; color: {labelFillFromHex(subTone.hex)};"
          aria-pressed={isSubSelected}
          onclick={(e) => {
            e.stopPropagation()
            onselect(subTone.notation)
            openTooltipKey = null
          }}
          onkeydown={(e) => e.key === "Enter" && onselect(subTone.notation)}
        >
          {subTone.notation}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tone-selector-root {
    position: relative;
    width: 100%;
  }

  /*
   * グレイバケットセルに重なる不可視HTMLアンカー。
   * SVG viewBox 座標をパーセンテージに変換して絶対配置。
   */
  .cell-anchor {
    position: absolute;
    pointer-events: none;
  }

  /*
   * CSS Anchor Positioning を使用。
   * デフォルト：アンカーの左側に表示（right: anchor(left)）
   * フォールバック：左に収まらない場合は右側に表示（@position-try --tooltip-right）
   * position: fixed にすることで SVG/HTML の境界を越えて機能する。
   */
  .gray-subtone-tooltip {
    position: fixed;
    position-try-fallbacks: --tooltip-right;
    position-try-order: most-width;

    /* デフォルト：アンカーの左側に配置 */
    right: anchor(left);
    margin-right: 8px;
    top: anchor(center);
    translate: 0 -50%;

    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 4px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    z-index: 100;
  }

  /* 右側フォールバック */
  @position-try --tooltip-right {
    right: unset;
    left: anchor(right);
    margin-right: 0;
    margin-left: 8px;
  }

  .subtone-item {
    border: 1px solid #ddd;
    border-radius: 3px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 0.4rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
  }

  .subtone-item.selected {
    border: 2px solid #333;
    outline: 1.5px dashed #333;
    outline-offset: 2px;
  }

  .subtone-item:focus-visible:not(.selected) {
    outline: 2px dashed white;
    outline-offset: 2px;
    box-shadow: 0 0 0 3.5px #3b82f6;
  }
</style>
