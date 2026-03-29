<script lang="ts">
  import type { Snippet } from "svelte"

  let { children, class: cls = "" }: { children?: Snippet; class?: string } = $props()
</script>

<div class="term-card {cls}">
  {@render children?.()}
</div>

<style>
  .term-card {
    --color-border: light-dark(#ddd, #444);
    --color-text: light-dark(#111, #f0f0f0);
    padding: 1.05rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    display: grid;
    gap: 0.75rem;
  }

  .term-card.-items-centering {
    justify-items: center;
  }

  .term-card :global(:is(p, h3)) {
    justify-self: flex-start;
  }

  .term-card :global(h3) {
    font-size: 1rem;
    margin: 0;
  }

  .term-card :global(p) {
    font-size: 0.85rem;
    line-height: 1.8;
    margin: 0 0 0.55rem;
    color: var(--color-text, #111);
  }
</style>
