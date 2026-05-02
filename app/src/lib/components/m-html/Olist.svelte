<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<ol>
  {@render children?.()}
</ol>

<style>
  ol {
    margin: 1rem 0;
    margin-inline-start: 0.75rem;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    counter-reset: ol-number;
  }

  ol :global(li) {
    font-size: 0.9rem;
    color: var(--color-body);
    line-height: 1.7;
    padding-left: 1.5rem;
    position: relative;
  }

  ol :global(li::before) {
    content: counter(ol-number) ".";
    counter-increment: ol-number;
    position: absolute;
    left: 0.1rem;
    top: 0;
  }
</style>
