<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/Heading1.svelte"

  let { title, children }: { title?: string; children: Snippet } = $props()
  const pageTitle = $derived(title ? `${title} - Color Prism` : "Color Prism")
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
