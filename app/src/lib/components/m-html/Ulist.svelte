<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<ul>
  {@render children?.()}
</ul>

<style>
  ul {
    margin: 0.9rem 0;
    font-size: 0.95rem;
    line-height: 2;
    padding-inline-start: 1.75rem;
  }

  ul :global(li) {
    padding: 0;
  }
</style>
