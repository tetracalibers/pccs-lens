<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { PCCS_MAP } from "$lib/data/pccs"

  let { pccs }: { pccs: string } = $props()

  const color = $derived(PCCS_MAP.get(pccs)!)
  const isLightBg = $derived(isLightColor(color))
</script>

<div class="square" style:--_pccs-color={color} style:--_text-color={isLightBg ? "black" : "white"}>
  {pccs}
</div>

<style>
  .square {
    --_square-size: 3rem;

    width: var(--_square-size);
    height: var(--_square-size);
    color: var(--_text-color);
    background-color: var(--_pccs-color);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    flex-shrink: 0;
  }
</style>
