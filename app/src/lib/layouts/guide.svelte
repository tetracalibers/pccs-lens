<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import Heading3 from "$lib/components/m-html/Heading3.svelte"
  import Heading4 from "$lib/components/m-html/Heading4.svelte"
  import Ulist from "$lib/components/m-html/Ulist.svelte"

  import Mark from "$lib/components/m-directive/Mark.svelte"
  import Tips from "$lib/components/m-directive/Tips.svelte"
  import Example from "$lib/components/m-directive/Example.svelte"
  import CardGrid from "$lib/components/m-directive/CardGrid.svelte"
  import TermCard from "$lib/components/m-directive/TermCard.svelte"

  /* eslint-disable no-import-assign */
  export {
    Heading2 as h2,
    Heading3 as h3,
    Heading4 as h4,
    Ulist as ul,
    Mark,
    Tips,
    Example,
    CardGrid,
    TermCard
  }
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
  <Heading1>{title}</Heading1>
  {@render children()}
</main>

<style>
  main {
    counter-reset: section;
    max-width: 680px;
    margin: 0 auto;
    padding: 0 1rem 0;
  }

  main :global(p) {
    color: light-dark(#556070, #9090b0);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }

  main :global(blockquote) {
    margin: 1.05rem 0;
    padding: 0.55rem 0.8rem;
    border-radius: 4px;
    border: 1px dashed light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.12));
    box-sizing: border-box;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  main :global(blockquote p) {
    margin: 0;
  }
</style>
