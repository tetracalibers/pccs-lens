<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import FamilyCard from "$lib/components/jis-color-map/FamilyCard.svelte"
  import JisColorAllListCard from "$lib/components/jis-color-map/JisColorAllListCard.svelte"
  import { JIS_COLOR_FAMILIES, JIS_HEX_BY_ID, type ColorFamily } from "$lib/data/jis-colors"
  import { FAMILY_DESCRIPTIONS } from "$lib/jis-color-map/family-copy"

  const CHECKER_COLOR_IDS: Record<ColorFamily, [string, string]> = {
    red: ["botan-iro", "carmine"],
    brown: ["burnt-umber", "kohaku-iro"],
    yellow: ["marigold", "jaune-brillant"],
    green: ["leaf-green", "tokiwa-iro"],
    blue: ["cyan", "ruri-iro"],
    purple: ["lilac", "kikyo-iro"],
    neutral: ["ivory", "lamp-black"]
  }

  const ALL_LIST_CHECKER_COLOR_IDS = [
    "botan-iro",
    "terracotta",
    "jaune-brillant",
    "leaf-green",
    "cyan",
    "wistaria"
  ]

  const hexById = (id: string): string => JIS_HEX_BY_ID.get(id) ?? "#cccccc"

  const familyCards = JIS_COLOR_FAMILIES.map((family) => {
    const [id1, id2] = CHECKER_COLOR_IDS[family.id]
    return {
      family,
      labelEn: family.id,
      description: FAMILY_DESCRIPTIONS[family.id],
      checkerColors: [hexById(id1), hexById(id2)] as [string, string]
    }
  })

  const allListCheckerColors = ALL_LIST_CHECKER_COLOR_IDS.map((id) => hexById(id))
</script>

<svelte:head>
  <title>慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>慣用色名マップ</Heading1>
  </div>

  <section class="section">
    <h2 class="section-heading">比較して覚える</h2>
    <p class="section-desc">似ている色を比べて覚えよう</p>
    <div class="grid">
      {#each familyCards as card (card.family.id)}
        <FamilyCard {...card} />
      {/each}
    </div>
  </section>

  <section class="section">
    <h2 class="section-heading">一覧で学ぶ</h2>
    <p class="section-desc">名前の由来やPCCS近似色など、色の詳細を学ぼう</p>
    <JisColorAllListCard checkerColors={allListCheckerColors} />
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
