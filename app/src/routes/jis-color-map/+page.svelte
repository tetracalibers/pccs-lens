<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import FamilyCard from "$lib/components/jis-color-map/FamilyCard.svelte"
  import JisColorAllListCard from "$lib/components/jis-color-map/JisColorAllListCard.svelte"
  import { JIS_COLOR_FAMILIES, JIS_COLORS_BY_GROUP, type ColorFamily } from "$lib/data/jis-colors"
  import { pickCheckerboardColors } from "$lib/jis-color-map/family-checker"
  import { FAMILY_DESCRIPTIONS } from "$lib/jis-color-map/family-copy"

  const familyCards = JIS_COLOR_FAMILIES.map((family) => ({
    family,
    labelEn: family.id,
    description: FAMILY_DESCRIPTIONS[family.id],
    checkerColors: pickCheckerboardColors(family.id)
  }))

  const pickOneHexFromFamily = (familyId: ColorFamily): string => {
    const colors = JIS_COLORS_BY_GROUP.get(familyId) ?? []
    if (colors.length === 0) return "#cccccc"
    return colors[Math.floor(Math.random() * colors.length)].hex
  }

  const allListCheckerColors = JIS_COLOR_FAMILIES.map((f) => pickOneHexFromFamily(f.id)) as [
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ]
</script>

<svelte:head>
  <title>慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>慣用色名マップ</Heading1>
  </div>

  <section class="section">
    <h2 class="section-heading">一覧で覚える</h2>
    <p class="section-desc">由来やPCCS近似値など、色の詳細を学ぼう</p>
    <JisColorAllListCard checkerColors={allListCheckerColors} />
  </section>

  <section class="section">
    <h2 class="section-heading">比較して覚える</h2>
    <p class="section-desc">似た色を比較して覚えよう</p>
    <div class="grid">
      {#each familyCards as card (card.family.id)}
        <FamilyCard {...card} />
      {/each}
    </div>
  </section>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2.5rem;
  }

  .section-heading {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  .section-desc {
    font-size: 0.85rem;
    color: var(--color-body);
    margin: 0 0 0.5rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
</style>
