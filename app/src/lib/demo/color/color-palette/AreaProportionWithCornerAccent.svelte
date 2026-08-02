<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import Icon from "@iconify/svelte"

  interface Props {
    base: string
    assort: string
    accent: string
    baseRatio?: number
    assortRatio?: number
    maxW?: number
  }

  let { base, assort, accent, baseRatio = 6, assortRatio = 4, maxW = 400 }: Props = $props()

  const baseColor = $derived(PCCS_HEX_MAP.get(base)!)
  const assortColor = $derived(PCCS_HEX_MAP.get(assort)!)
  const accentColor = $derived(PCCS_HEX_MAP.get(accent)!)
</script>

<div class="rect" style:max-width={maxW + "px"}>
  <div class="block" style:background-color={baseColor} style:flex-grow={baseRatio}></div>
  <div class="block" style:background-color={assortColor} style:flex-grow={assortRatio}></div>
  <div class="accent-icon" style:color={accentColor}>
    <Icon icon="game-icons:cat" width="46" height="46" />
  </div>
</div>

<style>
  .rect {
    position: relative;
    display: flex;
    width: 100%;
    height: 100px;
    overflow: hidden;
  }

  .block {
    height: 100%;
  }

  .accent-icon {
    position: absolute;
    left: 14px;
    bottom: 8px;
    line-height: 0;
    transform: scaleX(-1);
  }
</style>
