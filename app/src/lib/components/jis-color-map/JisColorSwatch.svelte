<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import type { JISColor } from "$lib/data/jis-colors"

  let {
    colors,
    pccs
  }: {
    colors: JISColor[]
    pccs?: { symbol: string; hex: string }
  } = $props()

  const bgHex = $derived(colors[0].hex)
  const textColor = $derived(isLightColor(bgHex) ? "#333" : "#fff")
  const pccsTextColor = $derived(pccs ? (isLightColor(pccs.hex) ? "#333" : "#fff") : "#fff")

  const maxDensityPerColor = $derived(
    Math.max(
      ...colors.map((c) => {
        if (c.nameSegments) {
          const longestSegment = Math.max(...c.nameSegments.map((s) => s.length))
          return Math.max(c.nameSegments.length, longestSegment)
        }
        return c.name.length
      })
    )
  )
  const totalLines = $derived(colors.reduce((sum, c) => sum + (c.nameSegments?.length ?? 1), 0))

  const fontSize = $derived.by(() => {
    const density = Math.max(maxDensityPerColor, totalLines)
    if (density >= 5) return "var(--map-font-xs, 0.55rem)"
    if (density >= 4) return "var(--map-font-s, 0.65rem)"
    return "var(--map-font-m, 0.75rem)"
  })

  const title = $derived(colors.map((c) => `${c.name}（${c.reading}）`).join(" / "))
</script>

<div class="cell">
  {#if pccs}
    <div class="pccs" style:background-color={pccs.hex}>
      <span class="pccs-symbol" style:color={pccsTextColor}>{pccs.symbol}</span>
    </div>
  {/if}
  <div
    class="swatch"
    style:background-color={bgHex}
    style:color={textColor}
    style:font-size={fontSize}
    {title}
  >
    <div class="names">
      {#each colors as color (color.id)}
        <div class="name">
          {#if color.nameSegments}
            {#each color.nameSegments as segment, i (i)}
              {segment}
              {#if i < color.nameSegments.length - 1}<br />{/if}
            {/each}
          {:else}
            {color.name}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .cell {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .pccs {
    position: absolute;
    top: 70%;
    left: 90%;
    transform: translateX(-50%);
    font-size: var(--map-font-l, 0.55rem);
    color: var(--color-body);
    white-space: nowrap;
    z-index: 1;
    display: grid;
    width: 50%;
    height: 50%;
    border-radius: 50%;
    place-items: center;
  }

  .pccs-symbol {
    font-family: var(--font-mono);
    font-size: var(--map-font-s);
  }

  .swatch {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 0.15rem;
    box-sizing: border-box;
    text-align: center;
    line-height: 1.1;
    font-family: var(--font-round);
  }

  .names {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    width: 100%;
  }

  .name {
    overflow: hidden;
    overflow-wrap: break-word;
  }
</style>
