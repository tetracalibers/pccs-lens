<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="term-grid">
  {@render children?.()}
</div>

<style>
  .term-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.05rem;
    margin: 1.05rem 0;
  }

  .term-grid :global(.term-card:last-child:nth-child(odd)) {
    grid-column: 1 / -1;
  }
</style>
