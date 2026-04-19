<script lang="ts">
  import {
    getFamilyIdBySubfamilyId,
    getJisColorsByIds,
    type ColorSubfamily,
    type JISCompareSection
  } from "$lib/data/jis-colors"
  import { FAMILY_PRIMARY_HEX } from "$lib/jis-color-map/family-copy"
  import {
    buildChromaCompareDiagram,
    buildHueCompareDiagram,
    buildValueCompareDiagram
  } from "$lib/jis-color-map/compare"
  import JisMiniColorMap from "./JisMiniColorMap.svelte"
  import HueCompareDiagram from "./HueCompareDiagram.svelte"
  import ValueCompareDiagram from "./ValueCompareDiagram.svelte"
  import ChromaCompareDiagram from "./ChromaCompareDiagram.svelte"

  let {
    subfamilyId,
    section
  }: {
    subfamilyId: ColorSubfamily
    section: JISCompareSection
  } = $props()

  const targets = $derived(getJisColorsByIds(section.targets))
  const hueDiagram = $derived(buildHueCompareDiagram(targets))
  const valueDiagram = $derived(buildValueCompareDiagram(targets))
  const chromaDiagram = $derived(buildChromaCompareDiagram(targets))

  const familyId = $derived(getFamilyIdBySubfamilyId(subfamilyId))
  const familyHex = $derived(familyId ? FAMILY_PRIMARY_HEX[familyId] : "#888888")

  const splitDescription = (text: string): string[] => {
    if (!text) return []
    return text.split(/\s+/).filter((s) => s.length > 0)
  }
</script>

<section class="compare">
  <div class="map-area">
    <JisMiniColorMap
      groupId={subfamilyId}
      highlightsJisIds={section.targets}
      hintJisIds={section.hintJIS}
      hintPCCSHueNums={section.hintPCCSHue}
    />
  </div>
  <div class="list-area" style:--_row-count={targets.length}>
    {#each targets as jis, i (jis.id)}
      <div class="row" style:--_row-index={i + 1}>
        {#if jis.examLevel !== null}
          <span
            class="level"
            class:level-2={jis.examLevel === 2}
            class:level-3={jis.examLevel === 3}
          >
            {jis.examLevel}級
          </span>
        {:else}
          <span class="level level-none"></span>
        {/if}
        <span class="preview" style:background-color={jis.hex}></span>
        <div class="info">
          <div class="name">{jis.name}</div>
          <div class="systematic">{jis.systematicName}</div>
          <div class="munsell">{jis.munsell}</div>
        </div>
      </div>
      <div class="desc" style:--_row-index={i + 1}>
        {#each splitDescription(jis.colorDescription) as line, li (li)}
          {line}{#if li < splitDescription(jis.colorDescription).length - 1}<br />{/if}
        {/each}
      </div>
    {/each}
    <div class="diagrams">
      <div class="diagram-slot">
        {#if hueDiagram}
          <HueCompareDiagram data={hueDiagram} />
        {/if}
      </div>
      <div class="diagram-slot">
        {#if valueDiagram}
          <ValueCompareDiagram data={valueDiagram} />
        {/if}
      </div>
      <div class="diagram-slot">
        {#if chromaDiagram}
          <ChromaCompareDiagram data={chromaDiagram} {familyHex} />
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 1rem 0;
    border-top: 1px solid var(--color-border, #e0e0e0);
  }

  @media (max-width: 640px) {
    .compare {
      grid-template-columns: 1fr;
    }
  }

  .list-area {
    display: grid;
    column-gap: 1.5rem;
    row-gap: 1rem;
    min-width: 0;
    grid-template-rows: repeat(var(--_row-count), 1fr);
    grid-template-columns: auto 1fr auto;
    height: fit-content;
    align-items: center;
    padding-block: 0.5rem;
  }

  .row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    row-gap: 0.5rem;
    column-gap: 0.75rem;
    grid-row: var(--_row-index);
  }

  .level {
    padding: 0.3rem;
    border-radius: 4px;
    font-size: 0.7rem;
    text-align: center;
    color: #1a1a2e;
    line-height: 1;
    align-self: center;
  }

  .level-2 {
    background-color: var(--color-grade-2);
  }

  .level-3 {
    background-color: var(--color-grade-3);
  }

  .level-none {
    visibility: hidden;
  }

  .preview {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    border: 1px solid var(--color-border, #d0d0d0);
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    grid-column: 1 / -1;
  }

  .name {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .systematic {
    font-size: 0.7rem;
    opacity: 0.85;
  }

  .munsell {
    font-size: 0.65rem;
    font-family: var(--font-mono);
    opacity: 0.7;
  }

  .diagrams {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    align-items: stretch;
    min-height: 7rem;
    height: 100%;
    grid-row: 1 / -1;
  }

  .diagram-slot {
    min-width: 36px;
  }

  .desc {
    text-align: center;
    font-size: 0.6rem;
    line-height: 1.5;
    color: var(--color-body);
    grid-row: var(--_row-index);
  }
</style>
