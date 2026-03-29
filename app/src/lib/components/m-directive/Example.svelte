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
    padding: 0.7rem 0.9rem;
    border: 1px solid light-dark(rgba(0, 80, 200, 0.2), rgba(77, 150, 255, 0.2));
    border-radius: 6px;
    background: light-dark(rgba(0, 80, 200, 0.04), rgba(77, 150, 255, 0.04));
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .example::before {
    content: "Example";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#0050c8, #4d96ff);
    margin-bottom: 0.35rem;
  }

  .example :global(p) {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: light-dark(#556070, #9090b0);
  }

  @media (prefers-color-scheme: dark) {
    .example {
      box-shadow: inset 0 0 20px rgba(77, 150, 255, 0.06);
    }

    .example::before {
      text-shadow: 0 0 8px rgba(77, 150, 255, 0.6);
    }
  }
</style>
