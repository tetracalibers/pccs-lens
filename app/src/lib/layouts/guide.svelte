<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import Heading3 from "$lib/components/m-html/Heading3.svelte"
  import Ulist from "$lib/components/m-html/Ulist.svelte"

  import Mark from "$lib/components/m-directive/Mark.svelte"
  import Tips from "$lib/components/m-directive/Tips.svelte"
  import Example from "$lib/components/m-directive/Example.svelte"
  import CardGrid from "$lib/components/m-directive/CardGrid.svelte"
  import TermCard from "$lib/components/m-directive/TermCard.svelte"

  // eslint-disable-next-line no-import-assign
  export { Heading2 as h2, Heading3 as h3, Ulist as ul, Mark, Tips, Example, CardGrid, TermCard }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"

  let { title, children }: { title?: string; children: Snippet } = $props()
  const pageTitle = $derived(title ? `${title} - PCCS Lens` : "PCCS Lens")
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<main>
  {@render children()}
</main>

<style>
  main {
    max-width: 700px;
    margin: 0 auto;
  }

  main :global(p) {
    color: var(--color-text, #111);
    margin: 0.55rem 0;
    font-size: 0.9rem;
    line-height: 2;
  }

  main :global(blockquote) {
    margin: 1.05rem 0;
    padding: 0.55rem 0.8rem;
    border-radius: 4px;
    border: 1px dashed lightgray;
    box-sizing: border-box;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  main :global(blockquote p) {
    margin: 0;
  }
</style>
