<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    maxW?: number
    style?: string
  }

  let { children, maxW, style }: Props = $props()
</script>

<div class="svg-wrapper" style:--_max-w={maxW ? `${maxW}px` : "none"} {style}>
  {@render children()}
</div>

<style>
  .svg-wrapper {
    width: 100%;
    box-sizing: border-box;
  }

  .svg-wrapper :global(> svg) {
    display: block;
    width: 100%;
    height: auto;
    padding-block: 1rem;
    box-sizing: border-box;
    max-width: var(--_max-w);
    margin-inline: auto;
  }
</style>
