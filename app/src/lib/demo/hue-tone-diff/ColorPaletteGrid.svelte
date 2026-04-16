<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="color-palette-grid">
  {@render children?.()}
</div>

<style>
  .color-palette-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 6rem));
    width: 100%;
    max-width: 80%;
    gap: 1rem;
    justify-items: center;
    justify-content: center;
  }
</style>
