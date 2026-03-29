<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<span class="mark">
  {@render children?.()}
</span>

<style>
  .mark {
    font-weight: 700;
    color: light-dark(#6b23a8, #e8c8ff);
  }
</style>
