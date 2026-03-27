<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<h2>
  {@render children?.()}
</h2>

<style>
  h2 {
    font-size: 1.3rem;
    margin: 2rem 0 1.6rem;
  }

  h2:first-of-type {
    margin-block-start: 0;
  }
</style>
