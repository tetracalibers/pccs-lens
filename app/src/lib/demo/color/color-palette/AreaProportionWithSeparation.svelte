<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  interface Props {
    base: string
    assort: string
    separation: string
    baseRatio?: number
    assortRatio?: number
    separationRatio?: number
    maxW?: number
  }

  let {
    base,
    assort,
    separation,
    baseRatio = 5.5,
    assortRatio = 4.25,
    separationRatio = 0.25,
    maxW = 400
  }: Props = $props()

  const baseColor = $derived(PCCS_HEX_MAP.get(base)!)
  const assortColor = $derived(PCCS_HEX_MAP.get(assort)!)
  const separationColor = $derived(PCCS_HEX_MAP.get(separation)!)
</script>

<div class="rect" style:max-width={maxW + "px"}>
  <div class="block" style:background-color={baseColor} style:flex-grow={baseRatio}></div>
  <div
    class="block"
    style:background-color={separationColor}
    style:flex-grow={separationRatio}
  ></div>
  <div class="block" style:background-color={assortColor} style:flex-grow={assortRatio}></div>
</div>

<style>
  .rect {
    display: flex;
    width: 100%;
    height: 100px;
    overflow: hidden;
  }

  .block {
    height: 100%;
  }
</style>
