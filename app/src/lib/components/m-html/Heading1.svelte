<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<h1>
  {@render children?.()}
</h1>

<style>
  h1 {
    counter-increment: section;
    font-size: 2.2rem;
    font-weight: 900;
    margin: 3.5rem 0 1.25rem;
    color: light-dark(#1a1a1a, #dde8f0);
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    line-height: 1.2;
  }

  h1::before {
    content: counter(section, decimal-leading-zero);
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
    color: light-dark(#7c3aed, #c4b5fd);
    flex-shrink: 0;
    margin-right: 0.1em;
  }

  h1:first-of-type {
    margin-block-start: 0;
  }

  @media (prefers-color-scheme: dark) {
    h1::before {
      opacity: 0.8;
    }
  }

  @media (prefers-color-scheme: light) {
    h1::before {
      opacity: 1;
    }
  }
</style>
