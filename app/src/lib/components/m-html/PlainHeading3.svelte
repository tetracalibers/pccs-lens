<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<h3>
  {@render children?.()}
</h3>

<style>
  h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1.3;
    margin: 1.6rem 0 0.45rem;
  }
</style>
