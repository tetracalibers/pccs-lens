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
    margin: 2.75rem auto;
    padding: 0 1rem;
  }

  main :global(h2) {
    font-size: 1.3rem;
    margin: 2rem 0 1.6rem;
  }

  main :global(h2):first-of-type {
    margin-block-start: 0;
  }

  main :global(h3) {
    font-size: 1.05rem;
    margin: 1.6rem 0 0.45rem;
  }

  main :global(p) {
    color: var(--color-text, #111);
    margin: 0.55rem 0;
    font-size: 0.9rem;
    line-height: 2;
  }

  main :global(ul) {
    margin: 0.9rem 0;
    font-size: 0.95rem;
    line-height: 2;
    padding-inline-start: 1.75rem;
  }

  main :global(li) {
    padding: 0;
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

  main :global(.tips),
  main :global(.example) {
    margin: 1.05rem 0;
    padding: 0.55rem 0.8rem;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  main :global(.tips) {
    border: 1px dashed lightgray;
  }

  main :global(.tips)::before {
    content: "Tips: ";
    color: oklch(from lightgray calc(l * 0.75) c h);
    font-weight: 600;
  }

  main :global(.example) {
    border: 1px dashed lightblue;
  }

  main :global(.example)::before {
    content: "Example: ";
    color: oklch(from lightblue calc(l * 0.75) c h);
    font-weight: 600;
  }

  /* container directive wraps content in <p>; display:inline makes it flow after ::before */
  main :global(.tips > p),
  main :global(.example > p) {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-text, #111);
  }

  main :global(.tips > p) {
    color: oklch(from lightgray calc(l * 0.6) c h);
  }

  main :global(.term-grid) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.05rem;
    margin: 1.05rem 0;
  }

  main :global(.term-card:last-child:nth-child(odd)) {
    grid-column: 1 / -1;
  }

  main :global(.term-card) {
    padding: 1.05rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    display: grid;
    gap: 0.75rem;
  }

  main :global(.term-card :is(p, h3)) {
    justify-self: flex-start;
  }

  main :global(.term-card h3) {
    font-size: 1rem;
    margin: 0;
  }

  main :global(.term-card p) {
    font-size: 0.85rem;
    line-height: 1.8;
    margin: 0 0 0.55rem;
    color: var(--color-text, #111);
  }

  main :global(.term-card.-items-centering) {
    justify-items: center;
  }

  main :global(.mark.-brackets) {
    line-height: 1;
    font-weight: 600;
  }

  main :global(.mark.-brackets)::before {
    content: "「";
  }

  main :global(.mark.-brackets)::after {
    content: "」";
  }
</style>
