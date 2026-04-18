<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"

  let { pccs }: { pccs: PCCSColor } = $props()

  const hueInfo = $derived(pccs.hueNumber !== null ? PCCS_HUE_MAP.get(pccs.hueNumber) : null)
  const symbol = $derived(hueInfo ? hueInfo.symbol : pccs.notation)
  const textColor = $derived(isLightColor(pccs.hex) ? "var(--color-body)" : "#fff")
</script>

<div class="cell" title={pccs.notation}>
  <div class="swatch" style:background-color={pccs.hex} style:color={textColor}>
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
    font-weight: 700;
    text-align: center;
    letter-spacing: -0.02em;
    font-size: var(--map-font-l, 0.7rem);
  }
</style>
