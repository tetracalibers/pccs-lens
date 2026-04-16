<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
    lastWide?: boolean
    cols?: number
  }

  let { children, lastWide = false, cols }: Props = $props()
</script>

<div
  class="term-grid"
  class:--_last-wide={lastWide}
  class:--_fixed-cols={cols}
  style:--_cols={cols}
>
  {@render children?.()}
</div>

<style>
  .term-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.05rem;
    margin: 1.05rem 0;
  }

  .term-grid.--_fixed-cols {
    grid-template-columns: repeat(var(--_cols), 1fr);
  }

  .term-grid.--_last-wide :global(.term-card:last-child:nth-child(odd)) {
    grid-column: 1 / -1;
  }
</style>
