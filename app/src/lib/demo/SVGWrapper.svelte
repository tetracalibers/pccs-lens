<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<div class="svg-wrapper">
  {@render children()}
</div>

<style>
  .svg-wrapper {
    width: 100%;
  }

  .svg-wrapper :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    padding-block: 1rem;
    box-sizing: border-box;
  }
</style>
