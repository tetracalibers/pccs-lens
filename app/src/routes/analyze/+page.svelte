<script lang="ts">
  import ColorEntryItem from "$lib/components/ColorEntryItem.svelte"
  import ColorSchemePreview from "$lib/components/ColorSchemePreview.svelte"
  import HueWheel from "$lib/components/HueWheel.svelte"
  import ToneDiagram from "$lib/components/ToneDiagram.svelte"
  import ColorAnalysisResults from "$lib/components/ColorAnalysisResults.svelte"
  import { findClosestPccs } from "$lib/color/approximate"
  import { deltaE2000 } from "$lib/color/ciede2000"
  import { hexToLab } from "$lib/color/convert"
  import pccsColors from "$lib/data/pccs_colors.json"
  import type { PCCSColor } from "$lib/data/types"
  import randomColor from "randomcolor"

  const colors = pccsColors as PCCSColor[]
  const TOP_N = 3
  const MIN_COLORS = 2
  const MAX_COLORS = 6

  type ColorEntry = {
    id: string
    inputHex: string
    selectedPCCS: PCCSColor
    alternatePCCS: [PCCSColor, PCCSColor]
    displayedPCCS: PCCSColor
  }

  function randomHex(): string {
    return randomColor()
  }

  function makeEntry(hex: string): ColorEntry {
    const results = findClosestPccs(hex, colors, TOP_N)
    return {
      id: crypto.randomUUID(),
      inputHex: hex,
      selectedPCCS: results[0].color,
      alternatePCCS: [results[1].color, results[2].color],
      displayedPCCS: results[0].color
    }
  }

  function initialEntries(): ColorEntry[] {
    return [makeEntry(randomHex()), makeEntry(randomHex())]
  }

  let entries: ColorEntry[] = $state(initialEntries())

  const inputHexList = $derived(entries.map((e) => e.inputHex))
  const displayedPCCSList = $derived(entries.map((e) => e.displayedPCCS))

  function addEntry() {
    if (entries.length >= MAX_COLORS) return
    entries = [...entries, makeEntry(randomHex())]
  }

  function removeEntry(id: string) {
    if (entries.length <= MIN_COLORS) return
    entries = entries.filter((e) => e.id !== id)
  }

  function onHexChange(id: string, hex: string) {
    entries = entries.map((e) => {
      if (e.id !== id) return e
      return (makeEntry(hex) satisfies ColorEntry) ? { ...makeEntry(hex), id } : e
    })
  }

  function onSelectAlternate(id: string, alternate: PCCSColor) {
    entries = entries.map((e) => {
      if (e.id !== id) return e
      const oldSelected = e.selectedPCCS
      const pool = [oldSelected, ...e.alternatePCCS.filter((a) => a !== alternate)]
      const inputLab = hexToLab(e.inputHex)
      const sorted = pool
        .map((c) => ({ color: c, deltaE: deltaE2000(inputLab, hexToLab(c.hex)) }))
        .sort((a, b) => a.deltaE - b.deltaE)
        .slice(0, 2)
        .map((r) => r.color)
      return {
        ...e,
        selectedPCCS: alternate,
        alternatePCCS: [sorted[0], sorted[1]],
        displayedPCCS: alternate
      }
    })
  }
</script>

<svelte:head>
  <title>PCCSによる配色の分析 - PCCS Lens</title>
</svelte:head>

<main>
  <h1>PCCSによる配色の分析</h1>

  <section class="approximation-section">
    <h2>配色に使う色</h2>
    <ul class="entry-list">
      {#each entries as entry (entry.id)}
        <ColorEntryItem
          bind:inputHex={entry.inputHex}
          selectedPCCS={entry.selectedPCCS}
          alternatePCCS={entry.alternatePCCS}
          showRemove={entries.length > MIN_COLORS}
          onHexChange={(hex) => onHexChange(entry.id, hex)}
          onSelectAlternate={(alt) => onSelectAlternate(entry.id, alt)}
          onRemove={() => removeEntry(entry.id)}
        />
      {/each}
    </ul>
    {#if entries.length < MAX_COLORS}
      <button class="add-btn" onclick={addEntry}>＋ 色を追加</button>
    {/if}
  </section>

  <section class="visualization-section">
    <h2>配色プレビュー</h2>
    <ColorSchemePreview {inputHexList} {displayedPCCSList} />
    <div class="diagrams">
      <HueWheel {displayedPCCSList} />
      <ToneDiagram {displayedPCCSList} isCard199={true} />
    </div>
  </section>

  <ColorAnalysisResults {displayedPCCSList} />
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    color: var(--color-text-secondary, #555);
  }

  .entry-list {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .add-btn {
    padding: 0.375rem 0.75rem;
    border: 1px dashed var(--color-border, #ccc);
    border-radius: 0.375rem;
    background: none;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #555);
  }

  .add-btn:hover {
    border-color: var(--color-text, #111);
    color: var(--color-text, #111);
  }

  .visualization-section {
    margin-top: 2rem;
  }

  .diagrams {
    margin-top: 1.25rem;
    display: flex;
    flex-wrap: wrap;
    column-gap: 3rem;
    row-gap: 0.75rem;
    align-items: center;
    justify-content: center;
  }

  .diagrams :global(svg) {
    width: 100%;
    max-width: 320px;
    height: auto;
  }
</style>
