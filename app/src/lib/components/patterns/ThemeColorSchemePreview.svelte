<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"
  import CopyButton from "$lib/components/CopyButton.svelte"

  let {
    base,
    assort,
    accent = null,
    isDynamic = false
  }: {
    base: PCCSColor
    assort: PCCSColor
    accent?: PCCSColor | null
    isDynamic?: boolean
  } = $props()

  type SwatchItem = {
    color: PCCSColor
    label: string
    grow: number
  }

  const swatches = $derived.by((): SwatchItem[] => {
    if (accent) {
      const grow = isDynamic ? 1 : undefined
      return [
        { color: base, label: "ベース", grow: grow ?? 6 },
        { color: assort, label: "アソート", grow: grow ?? 3 },
        { color: accent, label: "アクセント", grow: grow ?? 1 }
      ]
    }
    return [
      { color: base, label: "ベース", grow: 7 },
      { color: assort, label: "アソート", grow: 3 }
    ]
  })

  function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
  }
</script>

<div class="preview">
  {#each swatches as item (item.label)}
    {@const light = isLight(item.color.hex)}
    <div class="swatch" style="background-color: {item.color.hex}; flex-grow: {item.grow};">
      <div class="swatch-info" class:light>
        <span class="notation">{item.color.notation}</span>
        <div class="hex-row">
          <span class="hex">{item.color.hex}</span>
          <div class="hex-copy">
            <CopyButton
              text={item.color.hex}
              color={light
                ? `oklch(from ${item.color.hex} calc(l - .30) c h)`
                : `oklch(from ${item.color.hex} calc(l + .30) c h)`}
            />
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .preview {
    display: flex;
    width: 100%;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .swatch {
    position: relative;
    min-width: 0;
    display: flex;
    align-items: flex-end;
    padding: 0.4rem 0.5rem;
  }

  .swatch-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    color: rgba(0, 0, 0, 0.75);
  }

  .swatch-info.light {
    color: rgba(0, 0, 0, 0.7);
  }

  .swatch-info:not(.light) {
    color: rgba(255, 255, 255, 0.85);
  }

  .notation {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hex-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .hex {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
