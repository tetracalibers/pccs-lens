<script lang="ts">
  import { resolve } from "$app/paths"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import JisColorMap from "$lib/components/jis-color-map/JisColorMap.svelte"
  import JisColorCompareSection from "$lib/components/jis-color-map/JisColorCompareSection.svelte"
  import {
    JIS_COLOR_FAMILIES,
    getCompareSectionsBySubfamily,
    getSubfamiliesByGroup,
    type ColorFamily
  } from "$lib/data/jis-colors"

  let { data }: { data: { family: ColorFamily } } = $props()

  const family = $derived(JIS_COLOR_FAMILIES.find((f) => f.id === data.family)!)
  const subfamilies = $derived(getSubfamiliesByGroup(data.family))
  const crumbs = $derived([
    { label: "慣用色名マップ", href: resolve("/jis-color-map") },
    { label: family.name }
  ])
</script>

<svelte:head>
  <title>{family.name}の慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Breadcrumb {crumbs} category="contents" />
    <h1>{family.name}の慣用色名マップ</h1>
  </div>

  <JisColorMap groupId={data.family} />

  <div class="compare-sections">
    {#each subfamilies as sub (sub.id)}
      {@const sections = getCompareSectionsBySubfamily(sub.id)}
      {#if sections.length > 0}
        <section class="subfamily">
          <h2>{sub.name}</h2>
          <div class="compare-list">
            {#each sections as section, i (i)}
              <JisColorCompareSection subfamilyId={sub.id} {section} />
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>
</main>

<style>
  main {
    margin: 0 auto;
    max-width: 90cqw;
    display: grid;
    justify-items: flex-start;
    grid-template-columns: min-content;
    width: min-content;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }

  .compare-sections {
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: min(90cqw, 960px);
  }

  .subfamily {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .subfamily h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    padding-bottom: 0.25rem;
  }

  .compare-list {
    display: flex;
    flex-direction: column;
  }
</style>
