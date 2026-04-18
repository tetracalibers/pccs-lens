<script lang="ts">
  import { resolve } from "$app/paths"
  import Heading1 from "$lib/components/Heading1.svelte"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import JisColorMap from "$lib/components/jis-color-map/JisColorMap.svelte"
  import { JIS_COLOR_FAMILIES, type ColorFamily } from "$lib/data/jis-colors"

  let { data }: { data: { family: ColorFamily } } = $props()

  const family = $derived(JIS_COLOR_FAMILIES.find((f) => f.id === data.family)!)
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
    <Heading1 icon="mdi:palette-swatch" grayscale compact>
      {family.name}の慣用色名マップ
    </Heading1>
  </div>

  <JisColorMap groupId={data.family} />
</main>

<style>
  main {
    margin: 0 auto;
    max-width: 1200px;
  }

  .header {
    margin-inline-start: 1.5rem;
  }
</style>
