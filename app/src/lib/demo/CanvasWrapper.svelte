<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    style?: string
  }

  let { children, style }: Props = $props()
</script>

<div class="canvas-wrapper" {style}>
  {@render children()}
</div>

<style>
  .canvas-wrapper {
    margin-inline: 0.25rem;
    margin-block: 1.25rem;
  }
</style>
