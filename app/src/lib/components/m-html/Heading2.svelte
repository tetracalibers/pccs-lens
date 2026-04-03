<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<h2>
  <span class="dot"></span>
  {@render children?.()}
</h2>

<style>
  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--color-heading);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 0.55rem;
    line-height: 1.3;
    margin: 2rem 0 0.75rem;
  }

  .dot {
    display: inline-block;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    translate: 0 -5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }
</style>
