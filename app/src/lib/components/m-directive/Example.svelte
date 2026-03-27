<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="example">
  {@render children?.()}
</div>

<style>
  .example {
    margin: 1.05rem 0;
    padding: 0.55rem 0.8rem;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.9rem;
    line-height: 1.7;
    border: 1px dashed lightblue;
  }

  .example::before {
    content: "Example: ";
    color: oklch(from lightblue calc(l * 0.75) c h);
    font-weight: 600;
  }

  .example :global(p) {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-text, #111);
  }
</style>
