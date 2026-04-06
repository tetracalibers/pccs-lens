<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"

  import ComingSoon from "$lib/components/m-directive/ComingSoon.svelte"
  import MoreToCome from "$lib/components/m-directive/MoreToCome.svelte"
  import PageLink from "$lib/components/m-directive/PageLink.svelte"
  import DraftPageTitle from "$lib/components/m-directive/DraftPageTitle.svelte"

  /* eslint-disable no-import-assign */
  export { Heading2 as h2, ComingSoon, MoreToCome, PageLink, DraftPageTitle as PageDraft }
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/Heading1.svelte"

  let { title, children }: { title?: string; children: Snippet } = $props()
  const pageTitle = $derived(title ? `${title} - PCCS Lens` : "PCCS Lens")
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<main>
  <Heading1 icon="solar:pin-list-broken">{title}</Heading1>
  {@render children()}
</main>

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  }

  main :global(h3) {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1.3;
    margin: 1.6rem 0 0.45rem;
  }

  main :global(p) {
    color: var(--color-body);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }

  main :global(ul) {
    list-style: none;
    padding-inline: 1rem;
    display: flex;
    flex-direction: column;
    column-gap: 1rem;
    max-width: calc(680px - 1.5rem * 2);
  }

  main :global(li) {
    display: contents;
  }
</style>
