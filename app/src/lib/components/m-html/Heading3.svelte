<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<h3>
  {@render children?.()}
</h3>

<style>
  h3 {
    font-size: 1.05rem;
    margin: 1.6rem 0 0.45rem;
  }
</style>
