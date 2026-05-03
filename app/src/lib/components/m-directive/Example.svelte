<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="example">
  {@render children?.()}
</div>

<style>
  .example {
    margin: 1.5rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(180deg, #4d96ff, #6bcb77) 1;
    font-size: 0.88rem;
    line-height: 1.7;
    position: relative;
  }

  .example::before {
    content: "Example";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#0050c8, #4d96ff);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  .example :global(p) {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
