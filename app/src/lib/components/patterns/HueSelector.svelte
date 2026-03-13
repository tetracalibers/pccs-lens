<script lang="ts">
  import { lookupPCCSColor, isAchromaticTone } from "$lib/patterns/lookup"

  let {
    value,
    suggestedHues,
    allowedHues,
    selectedTone,
    onselect
  }: {
    value: number | null
    suggestedHues: number[]
    allowedHues: number[]
    selectedTone: string
    onselect: (hue: number) => void
  } = $props()

  const CX = 170
  const CY = 170
  const R = 110
  const R_INNER = 28
  const R_LABEL = 122
  const R_SWATCH = 146
  const SWATCH_R = 10
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

  // 無彩色トーンが選択されているか
  const isAchromaticSelected = $derived(isAchromaticTone(selectedTone))

  // 各色相のトーン連動色
  // 無彩色トーン選択時はデフォルト（HUE_COLORS）で表示
  function getHueColor(h: number): string {
    if (isAchromaticSelected) return HUE_COLORS[h]
    return lookupPCCSColor(h, selectedTone)?.hex ?? HUE_COLORS[h]
  }

  function getSwatchColor(h: number): string {
    return getHueColor(h)
  }

  function getSectorFill(h: number): string {
    if (isAchromaticSelected) return HUE_COLORS[h]
    return getHueColor(h)
  }

  function getSectorOpacity(h: number): number {
    if (isAchromaticSelected) return allowedSet.has(h) ? 1 : 0.2
    if (suggestedSet.has(h)) return 1
    return 0.2
  }

  function getSwatchOpacity(h: number): number {
    if (isAchromaticSelected) return allowedSet.has(h) ? 1 : 0.2
    if (suggestedSet.has(h)) return 1
    return 0.2
  }

  function isSelected(h: number): boolean {
    return !isAchromaticSelected && value === h
  }

  const HUES = Array.from({ length: 24 }, (_, i) => i + 1)

  let focusedHue: number | null = $state(null)
</script>

<svg viewBox="0 0 340 340" role="group" aria-label="色相選択" style="width: 100%;">
  <!-- 扇形（全色相塗りつぶし、サジェスト外は不透明度を下げて薄く表示） -->
  {#each HUES as h (h)}
    <path
      d={sectorPath(h)}
      fill={getSectorFill(h)}
      stroke="white"
      stroke-width="0.5"
      opacity={getSectorOpacity(h)}
      role="button"
      aria-label="色相{h}"
      aria-pressed={isSelected(h)}
      tabindex="0"
      style="cursor: pointer; outline: none;"
      onclick={() => onselect(h)}
      onkeydown={(e) => e.key === "Enter" && onselect(h)}
      onfocus={() => (focusedHue = h)}
      onblur={() => (focusedHue = null)}
    />
  {/each}

  <!-- 選択中扇形の強調枠 -->
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
    {#if focusedHue === h && !isSelected(h)}
      <path
        d={sectorPath(h)}
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-dasharray="3 2"
        style="pointer-events: none;"
      />
      <path
        d={sectorPath(h)}
        fill="none"
        stroke="#3b82f6"
        stroke-width="1.5"
        stroke-dasharray="3 2"
        style="pointer-events: none;"
      />
    {/if}
  {/each}

  <!-- 中心の白い円 -->
  <circle cx={CX} cy={CY} r={R_INNER + 1} fill="white" style="pointer-events: none;" />

  <!-- 色相番号ラベル（全24色相） -->
  {#each HUES as h (h)}
    {@const pos = polar(R_LABEL, sectorMidDeg(h))}
    {@const suggested = isAchromaticSelected ? allowedSet.has(h) : suggestedSet.has(h)}
    <text
      x={pos.x.toFixed(3)}
      y={pos.y.toFixed(3)}
      text-anchor="middle"
      dominant-baseline="central"
      font-family="var(--font-mono)"
      font-size={suggested ? 11 : 9}
      font-weight={suggested ? "bold" : "normal"}
      fill={suggested ? getHueColor(h) : "#666"}
      opacity={getSectorOpacity(h)}
      style="pointer-events: none; user-select: none;"
    >
      {h}
    </text>
  {/each}

  <!-- 円形色スウォッチ（円周外）：クリックで色相選択 -->
  {#each HUES as h (h)}
    {@const pos = polar(R_SWATCH, sectorMidDeg(h))}
    {@const selected = isSelected(h)}
    {@const swatchColor = getSwatchColor(h)}
    <circle
      cx={pos.x.toFixed(3)}
      cy={pos.y.toFixed(3)}
      r={SWATCH_R}
      fill={swatchColor}
      stroke={selected ? "#333" : "rgba(0,0,0,0.15)"}
      stroke-width={selected ? 2.5 : 1}
      opacity={getSwatchOpacity(h)}
      role="button"
      aria-label="色相{h}を選択"
      aria-pressed={selected}
      tabindex="0"
      style="cursor: pointer; outline: none;"
      onclick={() => onselect(h)}
      onkeydown={(e) => e.key === "Enter" && onselect(h)}
      onfocus={() => (focusedHue = h)}
      onblur={() => (focusedHue = null)}
    />
    {#if selected}
      <!-- 選択中スウォッチの外枠 -->
      <circle
        cx={pos.x.toFixed(3)}
        cy={pos.y.toFixed(3)}
        r={SWATCH_R + 3}
        fill="none"
        stroke={HUE_COLORS[h]}
        stroke-width="1.5"
        style="pointer-events: none;"
      />
    {/if}
    {#if focusedHue === h && !selected}
      <circle
        cx={pos.x.toFixed(3)}
        cy={pos.y.toFixed(3)}
        r={SWATCH_R + 3}
        fill="none"
        stroke="white"
        stroke-width="2"
        style="pointer-events: none;"
      />
      <circle
        cx={pos.x.toFixed(3)}
        cy={pos.y.toFixed(3)}
        r={SWATCH_R + 3}
        fill="none"
        stroke="#3b82f6"
        stroke-width="1.5"
        style="pointer-events: none;"
      />
    {/if}
  {/each}
</svg>
