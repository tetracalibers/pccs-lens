<script lang="ts">
  import type { Snippet } from "svelte"
  import { getContext } from "svelte"
  import Heading3 from "../m-html/Heading3.svelte"

  let {
    children,
    centering = false,
    title
  }: { children?: Snippet; centering?: boolean; title: string } = $props()

  const ankiCtx = getContext<{ isAnki: boolean } | undefined>("anki-mode")
  const isAnki = $derived(ankiCtx?.isAnki)

  const dummyText = $derived("X".repeat(title.length))
</script>

<div class="term-card" class:centering class:anki={isAnki}>
  <Heading3>{isAnki ? dummyText : title}</Heading3>
  {@render children?.()}
</div>

<style>
  .term-card {
    --color-border: light-dark(#ddd, #444);
    --color-text: var(--color-body);
    padding: 1.05rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    display: grid;
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

  .term-card.anki :global(h3) {
    font-family: var(--font-anki-title);
    color: dimgray;
  }

  .term-card :global(p) {
    font-size: 0.85rem;
    line-height: 1.8;
    margin: 0 0 0.55rem;
    color: var(--color-text, #111);
  }

  .term-card :global(p:last-child) {
    margin-block-end: 0;
  }
</style>
