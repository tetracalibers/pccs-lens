<script lang="ts">
  import { untrack } from "svelte"
  import {
    PCCS_TONE_BASED_PALETTE_RULE,
    PCCS_ACHROMATIC_TONE_SYMBOLS,
    type PCCS_TONE_BASED_PALETTE_KEY
  } from "$lib/data/pccs-tone"
  import { lookupPCCSColor } from "$lib/patterns/lookup"
  import ColorPaletteGrid from "$lib/demo/color-harmony/ColorPaletteGrid.svelte"
  import PCCSColor from "$lib/demo/PCCSColor.svelte"
  import { isLightColor } from "$lib/color/utils"

  let {
    hue,
    rule
  }: {
    hue: number
    rule: PCCS_TONE_BASED_PALETTE_KEY
  } = $props()

  // ToneSelector.svelte と同一レイアウト定数
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

  type ToneCell = {
    key: string
    label: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  // s トーンも他のトーンと同様に表示（ToneDiagram と異なり特別扱いなし）
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

  const ACHROMATIC_HEX: Record<string, string> = {
    W: "#ffffff",
    ltGy: "#c8c8c8",
    mGy: "#888888",
    dkGy: "#555555",
    Bk: "#1a1a1a"
  }

  const ruleObj = $derived(PCCS_TONE_BASED_PALETTE_RULE[rule])

  // 初期値は空文字。$effect.pre が最初のレンダリング前にランダムな allowedTone をセットする。
  // rule 変更時、現在の selectedTone が新しい allowedTones に含まれない場合もリセットする。
  // selectedTone の読み取りは untrack で囲むことで依存関係に加えず、
  // rule（= ruleObj.allowedTones）の変更のみで再実行される。
  let selectedTone = $state("")

  $effect.pre(() => {
    const allowed = ruleObj.allowedTones
    if (!allowed.includes(untrack(() => selectedTone))) {
      selectedTone = pickRandomTone(allowed)
    }
  })

  const allowedSet = $derived(new Set(ruleObj.allowedTones))
  const highlightedTones = $derived(ruleObj.suggestNext(selectedTone) ?? [])
  const highlightedSet = $derived(new Set(highlightedTones))

  let focusedKey: string | null = $state(null)

  function pickRandomTone(tones: string[]): string {
    return tones[Math.floor(Math.random() * tones.length)]
  }

  function getFillColor(key: string): string {
    if (key in ACHROMATIC_HEX) return ACHROMATIC_HEX[key]
    return lookupPCCSColor(hue, key)?.hex ?? "#e0e0e0"
  }

  function getLabelFill(hex: string): string {
    return isLightColor(hex)
      ? `color-mix(in srgb, black 70%, ${hex})`
      : `color-mix(in srgb, white 60%, ${hex})`
  }

  function getSelectedRingStroke(hex: string): string {
    return `oklch(from ${hex} calc(l - .10) c calc(h - 10))`
  }

  // セルの不透明度
  // - 選択中 / ハイライト: 不透明
  // - allowedTones 内だがハイライトでない: やや薄く
  // - allowedTones 外: 不透明（代わりに斜線で選択不可を表示）
  function getCellOpacity(key: string): number {
    if (key === selectedTone || highlightedSet.has(key)) return 1
    if (allowedSet.has(key)) return 0.2
    return 1
  }

  // 複数インスタンス配置時の clipPath ID 衝突を防ぐ
  const instanceId = Math.random().toString(36).slice(2, 8)
  function getClipId(key: string): string {
    return `tone-preview-clip-${instanceId}-${key}`
  }

  function handleSelect(key: string) {
    if (!allowedSet.has(key)) return
    selectedTone = key
  }

  // PCCS_MAP のキー形式に変換する（有彩色: toneSymbol+hue、無彩色: バケット代表のnotation）
  function getToneNotation(toneSymbol: string): string {
    if (PCCS_ACHROMATIC_TONE_SYMBOLS.includes(toneSymbol)) {
      return lookupPCCSColor(null, toneSymbol)?.notation ?? toneSymbol
    }
    return `${toneSymbol}${hue}`
  }
</script>

<div class="root">
  <!-- トーン図 -->
  <div class="diagram-wrapper">
    <svg
      viewBox="0 0 {SVG_W} {SVG_H}"
      role="group"
      aria-label="トーン選択"
      style="width: 100%; overflow: visible;"
    >
      <defs>
        {#each CELLS as cell (cell.key)}
          <clipPath id={getClipId(cell.key)}>
            {#if cell.shape === "circle"}
              <circle cx={cell.cx} cy={cell.cy} r={CIRCLE_R} />
            {:else}
              <rect
                x={cell.cx - RECT_W / 2}
                y={cell.cy - RECT_H / 2}
                width={RECT_W}
                height={RECT_H}
                rx="3"
              />
            {/if}
          </clipPath>
        {/each}
      </defs>

      {#each CELLS as cell (cell.key)}
        {@const selected = cell.key === selectedTone}
        {@const highlighted = highlightedSet.has(cell.key)}
        {@const allowed = allowedSet.has(cell.key)}
        {@const clickable = allowed}
        {@const opacity = getCellOpacity(cell.key)}
        <!-- allowedTones にないセルは色をつけず、ストロークも中立色に -->
        {@const hex = allowed ? getFillColor(cell.key) : "var(--cell-empty-fill)"}
        {@const strokeHex = allowed
          ? `oklch(from ${getFillColor(cell.key)} calc(l * .85) c h)`
          : "var(--cell-empty-stroke)"}
        {@const labelFill = allowed
          ? getLabelFill(getFillColor(cell.key))
          : "var(--cell-empty-label)"}

        <g
          role="button"
          aria-label={cell.label}
          aria-disabled={clickable ? undefined : true}
          tabindex={clickable ? 0 : -1}
          style="cursor: {clickable ? 'pointer' : 'default'}; outline: none;"
          onfocus={() => {
            if (clickable) focusedKey = cell.key
          }}
          onblur={() => (focusedKey = null)}
          onclick={() => handleSelect(cell.key)}
          onkeydown={(e) => {
            if (e.key === "Enter" && clickable) {
              e.preventDefault()
              handleSelect(cell.key)
            }
          }}
        >
          {#if cell.shape === "circle"}
            <circle
              cx={cell.cx}
              cy={cell.cy}
              r={CIRCLE_R}
              fill={hex}
              fill-opacity={opacity}
              stroke={strokeHex}
              stroke-opacity={opacity}
              stroke-width={highlighted ? 1.5 : 1}
            />
          {:else}
            <rect
              x={cell.cx - RECT_W / 2}
              y={cell.cy - RECT_H / 2}
              width={RECT_W}
              height={RECT_H}
              rx="3"
              fill={hex}
              fill-opacity={opacity}
              stroke={strokeHex}
              stroke-opacity={opacity}
              stroke-width={highlighted ? 1.5 : 1}
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
                stroke-width="1.5"
                stroke-dasharray="3 2"
                stroke={getSelectedRingStroke(hex)}
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
                stroke-width="1.5"
                stroke-dasharray="3 2"
                stroke={getSelectedRingStroke(hex)}
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
                r={CIRCLE_R + 2}
                fill="none"
                stroke="Highlight"
                stroke-width="2"
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
                stroke="Highlight"
                stroke-width="2"
                style="pointer-events: none;"
              />
            {/if}
          {/if}

          <!-- allowedTones 外のセルに右上→左下の斜線 -->
          {#if !allowed}
            {@const x1 = cell.shape === "circle" ? cell.cx + CIRCLE_R : cell.cx + RECT_W / 2}
            {@const y1 = cell.shape === "circle" ? cell.cy - CIRCLE_R : cell.cy - RECT_H / 2}
            {@const x2 = cell.shape === "circle" ? cell.cx - CIRCLE_R : cell.cx - RECT_W / 2}
            {@const y2 = cell.shape === "circle" ? cell.cy + CIRCLE_R : cell.cy + RECT_H / 2}
            <line
              {x1}
              {y1}
              {x2}
              {y2}
              stroke="var(--cell-empty-stroke)"
              stroke-width="1.5"
              clip-path="url(#{getClipId(cell.key)})"
              style="pointer-events: none;"
            />
          {/if}

          <text
            x={cell.cx}
            y={cell.cy}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-size={selected || highlighted ? 11 : 10}
            font-weight={selected ? "bold" : "normal"}
            style="pointer-events: none; user-select: none;"
            fill={labelFill}
            fill-opacity={opacity}
          >
            {cell.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>

  <!-- 配色プレビュー -->
  {#if highlightedTones.length > 0 && selectedTone !== ""}
    <ColorPaletteGrid>
      {#each highlightedTones as highlightedTone (highlightedTone)}
        <div class="pair">
          <PCCSColor pccs={getToneNotation(selectedTone)} />
          <PCCSColor pccs={getToneNotation(highlightedTone)} />
        </div>
      {/each}
    </ColorPaletteGrid>
  {/if}
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .diagram-wrapper {
    width: 100%;
    max-width: 220px;
    --cell-empty-fill: light-dark(white, #1c1c2e);
    --cell-empty-stroke: light-dark(#ccc, #3a3a4e);
    --cell-empty-label: light-dark(#aaa, #555);
  }

  .pair {
    display: flex;
  }
</style>
