<script lang="ts">
  import HueWheel from "$lib/components/analyze/HueWheel.svelte"
  import ToneDiagram from "$lib/components/analyze/ToneDiagram.svelte"
  import { PCCS_ALL_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"
  import { ankiMode } from "$lib/state/anki.svelte"
  import ColorPalettePreview from "./ColorPalettePreview.svelte"

  interface Props {
    pccsCSV: string
    hideTone?: boolean
    useToneColor?: boolean
  }

  let { pccsCSV, hideTone = false, useToneColor = false }: Props = $props()

  const pccsSymbols = $derived(() => pccsCSV.split(",").map((s) => s.trim()))

  const displayedPCCSList = $derived(() => {
    return pccsSymbols()
      .map((sym) => PCCS_ALL_MAP.get(sym))
      .filter((c): c is PCCSColor => c !== undefined)
  })

  const isAnki = $derived(ankiMode.isAnki)
</script>

<div class="analyzed-palette-root" class:--_anki={isAnki}>
  <div class="palette-preview"><ColorPalettePreview pccsSymbols={pccsSymbols()} /></div>
  <div class="hue-wheel"><HueWheel displayedPCCSList={displayedPCCSList()} {useToneColor} /></div>
  {#if !hideTone}
    <div class="tone-diagram">
      <ToneDiagram displayedPCCSList={displayedPCCSList()} isCard199={false} />
    </div>
  {/if}
</div>

<style>
  .analyzed-palette-root {
    display: grid;
    column-gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(0, 250px));
    grid-template-rows: auto auto;
    place-items: center;
    justify-content: center;
  }

  .palette-preview {
    grid-column: 1;
    margin-block: 1rem;
  }

  .hue-wheel {
    grid-column: 1;
    width: 100%;
    justify-self: flex-end;
  }

  .tone-diagram {
    max-width: 230px;
    width: 100%;
  }

  .--_anki :is(.hue-wheel, .tone-diagram) :global(text) {
    display: none;
  }
</style>
