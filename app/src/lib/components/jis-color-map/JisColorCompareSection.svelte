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
  <div class="list-area">
    <div class="rows">
      {#each targets as jis (jis.id)}
        <div class="row">
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
      {/each}
    </div>
    {#if hueDiagram || valueDiagram || chromaDiagram}
      <div class="diagrams">
        {#if hueDiagram}
          <div class="diagram-slot">
            <HueCompareDiagram data={hueDiagram} />
          </div>
        {/if}
        {#if valueDiagram}
          <div class="diagram-slot">
            <ValueCompareDiagram data={valueDiagram} />
          </div>
        {/if}
        {#if chromaDiagram}
          <div class="diagram-slot">
            <ChromaCompareDiagram data={chromaDiagram} {familyHex} />
          </div>
        {/if}
      </div>
    {/if}
    <div class="descriptions">
      {#each targets as jis (jis.id)}
        <div class="desc">
          {#each splitDescription(jis.colorDescription) as line, li (li)}
            {line}{#if li < splitDescription(jis.colorDescription).length - 1}<br />{/if}
          {/each}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .compare {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.5rem;
    padding: 1rem 0;
    border-top: 1px solid var(--color-border, #e0e0e0);
  }

  @media (max-width: 640px) {
    .compare {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .map-area {
    min-width: 0;
  }

  .list-area {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .level {
    flex-shrink: 0;
    width: 2.25rem;
    padding: 0.15rem 0.3rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: var(--font-mono);
    text-align: center;
    color: #fff;
  }

  .level-2 {
    background-color: #d35400;
  }

  .level-3 {
    background-color: #2980b9;
  }

  .level-none {
    visibility: hidden;
  }

  .preview {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    border: 1px solid var(--color-border, #d0d0d0);
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    text-align: center;
    min-width: 0;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .systematic {
    font-size: 0.8rem;
    opacity: 0.85;
  }

  .munsell {
    font-size: 0.7rem;
    font-family: var(--font-mono);
    opacity: 0.7;
  }

  .diagrams {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: stretch;
    min-height: 7rem;
  }

  .diagram-slot {
    flex: 0 0 auto;
    display: flex;
  }

  .descriptions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .desc {
    text-align: center;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--color-body);
  }
</style>
