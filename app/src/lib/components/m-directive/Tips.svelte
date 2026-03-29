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
    padding: 0.3rem 0;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .tips::before {
    content: "Tips";
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: light-dark(#ffffff, #1a1a1a);
    background: light-dark(#555555, #888888);
    border-radius: 3px;
    padding: 2px 6px;
    line-height: 1.4;
    opacity: 0.9;
  }

  .tips :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: light-dark(#556070, #9090b0);
  }
</style>
