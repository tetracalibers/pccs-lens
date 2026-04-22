<script lang="ts">
  import Icon from "@iconify/svelte"
  import { SvelteMap } from "svelte/reactivity"
  import { resolve } from "$app/paths"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import JisColorDetailSection from "$lib/components/jis-color-map/JisColorDetailSection.svelte"
  import {
    JIS_COLOR_FAMILIES,
    JIS_COLORS_BY_GROUP,
    getSortedAllJisColors,
    type ColorFamily,
    type JISColor
  } from "$lib/data/jis-colors"
  import { JIS_COLOR_ICON_MAP, type JISColorIconKey } from "$lib/data/jis-color-icon"

  const sortedColors = getSortedAllJisColors()

  const familyIdByColorId = (() => {
    const map = new SvelteMap<string, ColorFamily>()
    for (const family of JIS_COLOR_FAMILIES) {
      const colors = JIS_COLORS_BY_GROUP.get(family.id) ?? []
      for (const color of colors) {
        map.set(color.id, family.id)
      }
    }
    return map
  })()

  const sortedColorsByFamily = (() => {
    const map = new SvelteMap<ColorFamily, JISColor[]>()
    for (const family of JIS_COLOR_FAMILIES) {
      map.set(family.id, [])
    }
    for (const color of sortedColors) {
      const familyId = familyIdByColorId.get(color.id)
      if (familyId) map.get(familyId)?.push(color)
    }
    return map
  })()

  const crumbs = [{ label: "慣用色名マップ", href: resolve("/jis-color-map") }, { label: "全一覧" }]

  const resolveIconId = (iconKey: string): string | undefined =>
    JIS_COLOR_ICON_MAP.get(iconKey as JISColorIconKey)
</script>

<svelte:head>
  <title>慣用色名 全一覧 — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Breadcrumb {crumbs} category="contents" />
    <h1>慣用色名 全一覧</h1>
  </div>

  <nav class="icon-index" aria-label="慣用色名インデックス">
    {#each sortedColors as jisColor (jisColor.id)}
      {@const iconId = resolveIconId(jisColor.iconKey)}
      {#if iconId}
        <a href="#{jisColor.id}" class="icon-anchor" aria-label={jisColor.name}>
          <span class="icon" style:color={jisColor.hex} aria-hidden="true">
            <Icon icon={iconId} />
          </span>
        </a>
      {/if}
    {/each}
  </nav>

  <div class="family-sections">
    {#each JIS_COLOR_FAMILIES as family (family.id)}
      {@const familyColors = sortedColorsByFamily.get(family.id) ?? []}
      {#if familyColors.length > 0}
        <section class="family-section">
          <h2>{family.name}</h2>
          <JisColorDetailSection {family} jisColors={familyColors} />
        </section>
      {/if}
    {/each}
  </div>
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  main {
    max-width: min(800px, 95cqw);
    margin: 0 auto;
    padding-inline: 1rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }

  .icon-index {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    margin-bottom: 2.5rem;
  }

  .icon-anchor {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 4px;
    text-decoration: none;
    transition: background-color 0.15s;
  }

  .icon-anchor:hover,
  .icon-anchor:focus-visible {
    background-color: light-dark(#f0f0f0, #2e2e3e);
  }

  .icon {
    font-size: 1.5rem;
    display: inline-flex;
  }

  .family-sections {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    margin-inline: -1rem;
  }

  .family-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .family-section h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }
</style>
