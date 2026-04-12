<script lang="ts">
  import type { Snippet } from "svelte"

  let { children, maxW }: { children: Snippet; maxW?: number } = $props()
</script>

<div class="svg-wrapper" style:--_max-w={maxW ? `${maxW}px` : "none"}>
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
    max-width: var(--_max-w);
    margin-inline: auto;
  }
</style>
