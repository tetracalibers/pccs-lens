<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    maxW?: number
    style?: string
    noPadding?: boolean
  }

  let { children, maxW, style, noPadding = false }: Props = $props()
</script>

<div
  class="svg-wrapper"
  class:--_no-padding={noPadding}
  style:--_max-w={maxW ? `${maxW}px` : "none"}
  {style}
>
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
  .svg-wrapper.--_no-padding :global(> svg) {
    padding-block: 0;
  }
</style>
