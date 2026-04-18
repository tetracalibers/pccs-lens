<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import FamilyCard from "$lib/components/jis-color-map/FamilyCard.svelte"
  import { JIS_COLOR_FAMILIES } from "$lib/data/jis-colors"
  import { pickCheckerboardColors } from "$lib/jis-color-map/family-checker"
  import { FAMILY_DESCRIPTIONS } from "$lib/jis-color-map/family-copy"

  const familyCards = JIS_COLOR_FAMILIES.map((family) => ({
    family,
    labelEn: family.id,
    description: FAMILY_DESCRIPTIONS[family.id],
    checkerColors: pickCheckerboardColors(family.id)
  }))
</script>

<svelte:head>
  <title>慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>慣用色名マップ</Heading1>
  </div>

  <div class="grid">
    {#each familyCards as card (card.family.id)}
      <FamilyCard {...card} />
    {/each}
  </div>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
</style>
