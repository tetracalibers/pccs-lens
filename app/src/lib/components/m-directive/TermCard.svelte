<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading3 from "../m-html/Heading3.svelte"

  interface Props {
    children?: Snippet
    centering?: boolean
    textCentering?: boolean
    title: string
  }

  let { children, centering = false, textCentering = false, title }: Props = $props()
</script>

<section class="term-card" class:centering class:text-centering={textCentering}>
  {#if title}
    <Heading3 {title}>{title}</Heading3>
  {/if}
  {@render children?.()}
</section>

<style>
  .term-card {
    --color-border: light-dark(#ddd, #444);
    --color-text: var(--color-body);
    padding: 1.05rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    display: grid;
    align-content: flex-start;
    gap: 0.75rem;
  }

  .term-card.centering {
    justify-items: center;
  }

  .term-card :global(:is(p, h3)) {
    justify-self: flex-start;
  }

  .term-card :global(h3) {
    font-size: 1rem;
    margin: 0;
  }

  .term-card :global(:is(p, li)) {
    font-size: 0.85rem;
    color: var(--color-text, #111);
  }

  .term-card :global(p) {
    margin: 0 0 0.55rem;
    line-height: 1.8;
  }

  .term-card :global(li) {
    line-height: 1.4;
  }

  .term-card :global(p:last-child) {
    margin-block-end: 0;
  }

  .term-card :global(ul) {
    margin-block: 0;
  }
  .term-card :global(p:has(+ ul)) {
    margin-block: 0;
  }

  .term-card.text-centering :global(:is(p)) {
    justify-self: center;
  }
</style>
