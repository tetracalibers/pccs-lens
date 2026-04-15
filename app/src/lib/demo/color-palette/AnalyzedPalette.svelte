<script lang="ts">
  import HueWheel from "$lib/components/analyze/HueWheel.svelte"
  import ToneDiagram from "$lib/components/analyze/ToneDiagram.svelte"
  import { PCCS_ALL_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"
  import ColorPalettePreview from "./ColorPalettePreview.svelte"

  interface Props {
    pccsCSV: string
  }

  let { pccsCSV }: Props = $props()

  const pccsSymbols = $derived(() => pccsCSV.split(",").map((s) => s.trim()))

  const displayedPCCSList = $derived(() => {
    return pccsSymbols()
      .map((sym) => PCCS_ALL_MAP.get(sym))
      .filter((c): c is PCCSColor => c !== undefined)
  })
</script>

<div class="analyzed-palette-root">
  <div class="palette-preview"><ColorPalettePreview pccsSymbols={pccsSymbols()} /></div>
  <div class="analyzed-result">
    <div class="hue-wheel"><HueWheel displayedPCCSList={displayedPCCSList()} /></div>
    <div class="tone-diagram">
      <ToneDiagram displayedPCCSList={displayedPCCSList()} isCard199={false} />
    </div>
  </div>
</div>

<style>
  .analyzed-palette-root {
    display: grid;
    gap: 1rem;
  }

  .palette-preview {
    justify-self: center;
  }

  .analyzed-result {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 250px));
    column-gap: 1rem;
    row-gap: 0.75rem;
    align-items: center;
    justify-content: center;
  }

  .tone-diagram {
    max-width: 230px;
    width: 100%;
  }
</style>
