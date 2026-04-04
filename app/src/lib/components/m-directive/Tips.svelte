<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="tips">
  {@render children?.()}
</div>

<style>
  .tips {
    margin: 1.05rem 0;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(180deg, #ffd93d, #ff6b6b) 1;
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .tips::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#9a6200, #ffd93d);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  .tips :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
