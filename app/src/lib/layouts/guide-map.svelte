<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"

  import Mark from "$lib/components/m-directive/Mark.svelte"
  import PageLink from "$lib/components/m-directive/PageLink.svelte"

  /* eslint-disable no-import-assign */
  export { Heading2 as h2, Mark, PageLink }
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/m-html/Heading1.svelte"

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

  main :global(p) {
    color: light-dark(#556070, #9090b0);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }

  main :global(ul) {
    list-style: none;
    padding-inline: 1rem;
    margin-inline-start: 0.5rem;
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 3rem;
  }

  main :global(li) {
    display: contents;
  }
</style>
