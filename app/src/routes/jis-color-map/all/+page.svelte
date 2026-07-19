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
    type JISColorFamily
  } from "$lib/data/jis-colors"
  import { JIS_COLOR_ICON_MAP, type JISColorIconKey } from "$lib/data/jis-color-icon"

  const sortedColors = getSortedAllJisColors()

  const familyByColorId = (() => {
    const map = new SvelteMap<string, JISColorFamily>()
    for (const family of JIS_COLOR_FAMILIES) {
      const colors = JIS_COLORS_BY_GROUP.get(family.id) ?? []
      for (const color of colors) {
        map.set(color.id, family)
      }
    }
    return map
  })()

  const entries = sortedColors.flatMap((jisColor) => {
    const family = familyByColorId.get(jisColor.id)
    return family ? [{ jisColor, family }] : []
  })

  const crumbs = [{ label: "慣用色名マップ", href: resolve("/jis-color-map") }, { label: "すべて" }]

  const resolveIconId = (iconKey: string): string | undefined =>
    JIS_COLOR_ICON_MAP.get(iconKey as JISColorIconKey)
</script>

<svelte:head>
  <title>すべての慣用色名一覧 — Color Prism</title>
</svelte:head>

<main>
  <div class="main-inner">
    <div class="header">
      <Breadcrumb {crumbs} category="contents" />
      <h1>すべての慣用色名一覧</h1>
    </div>

    <nav class="icon-index" aria-label="慣用色名インデックス">
      {#each sortedColors as jisColor (jisColor.id)}
        {@const iconId = resolveIconId(jisColor.iconKey)}
        {#if iconId}
          <a href="#{jisColor.id}" class="icon-anchor" aria-label={jisColor.name}>
            <span class="icon" style:color={jisColor.rgb} aria-hidden="true">
              <Icon icon={iconId} />
            </span>
          </a>
        {/if}
      {/each}
    </nav>

    <JisColorDetailSection {entries} />
  </div>
</main>

<style>
  main {
    max-width: var(--main-width-current);
    margin: 0 auto;
    padding-inline: 1rem;
  }

  .main-inner {
    margin-inline: -1rem;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
    gap: 0.5rem;
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
</style>
