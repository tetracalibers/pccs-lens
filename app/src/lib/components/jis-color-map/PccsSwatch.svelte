<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"

  interface Props {
    pccs: PCCSColor
    compact?: boolean
    variant?: "fill" | "outline"
  }

  let { pccs, compact = false, variant = "fill" }: Props = $props()

  const hueInfo = $derived(pccs.hueNumber !== null ? PCCS_HUE_MAP.get(pccs.hueNumber) : null)
  const symbol = $derived(hueInfo ? hueInfo.symbol : pccs.notation)
  const textColor = $derived(isLightColor(pccs.hex) ? "#333" : "#fff")
</script>

<div class="cell" class:--_compact={compact} class:--_outline={variant === "outline"}>
  <div class="swatch" style:--_pccs-hex={pccs.hex} style:--_text-color={textColor}>
    {symbol}
  </div>
</div>

<style>
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .swatch {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.02em;
    font-size: var(--map-font-l, 0.7rem);
    font-family: var(--font-mono);
    background-color: var(--_pccs-hex);
    color: var(--_text-color);
  }

  .--_compact .swatch {
    font-size: var(--map-font-m);
  }

  .--_outline .swatch {
    background: none;
    border: 1px solid var(--_pccs-hex);
    color: var(--_pccs-hex);
    box-sizing: border-box;
  }
</style>
