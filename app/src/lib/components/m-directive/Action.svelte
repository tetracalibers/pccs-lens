<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="action">
  {@render children?.()}
</div>

<style>
  .action {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(to top, #ff9a9e, #f953c6) 1;
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .action::before {
    content: "Action";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#a0005a, #ff9a9e);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  .action :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
