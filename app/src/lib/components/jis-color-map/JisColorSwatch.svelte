<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import type { JISColor } from "$lib/data/jis-colors"

  let {
    colors,
    pccsSymbol
  }: {
    colors: JISColor[]
    pccsSymbol?: string
  } = $props()

  const bgHex = $derived(colors[0].hex)
  const textColor = $derived(isLightColor(bgHex) ? "#333" : "#fff")

  const maxSegments = $derived(
    Math.max(...colors.map((c) => c.nameSegments?.length ?? c.name.length))
  )
  const totalLines = $derived(colors.reduce((sum, c) => sum + (c.nameSegments?.length ?? 1), 0))

  const fontSize = $derived.by(() => {
    const density = Math.max(maxSegments, totalLines)
    if (density >= 5) return "var(--map-font-xs, 0.55rem)"
    if (density >= 4) return "var(--map-font-s, 0.65rem)"
    if (density >= 3) return "var(--map-font-m, 0.75rem)"
    return "var(--map-font-l, 0.85rem)"
  })

  const title = $derived(colors.map((c) => `${c.name}（${c.reading}）`).join(" / "))
</script>

<div class="cell">
  {#if pccsSymbol}
    <span class="pccs-symbol">{pccsSymbol}</span>
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

  .pccs-symbol {
    position: absolute;
    top: calc(var(--cell-size, 72px) * -0.08);
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--map-font-xs, 0.55rem);
    padding: calc(var(--cell-size, 72px) * 0.01) calc(var(--cell-size, 72px) * 0.06);
    background: var(--color-bg, #fff);
    border: 1px solid var(--color-body);
    border-radius: 999px;
    color: var(--color-body);
    white-space: nowrap;
    z-index: 1;
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
