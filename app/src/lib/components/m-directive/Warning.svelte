<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="warning">
  {@render children?.()}
</div>

<style>
  .warning {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(180deg, light-dark(#e8112d, #ff3131), #ff623d) 1;
    position: relative;
    font-size: 0.88rem;
    line-height: 1.8;
  }

  .warning::before {
    content: "Warning";
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#e60024, #f95e4f);
    margin-bottom: 0.25rem;
  }

  .warning :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-heading);
  }
</style>
