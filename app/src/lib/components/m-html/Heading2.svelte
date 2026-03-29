<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<h2>
  {@render children?.()}
</h2>

<style>
  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: light-dark(#1a1a1a, #eeeef8);
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    line-height: 1.3;
    margin: 2rem 0 0.75rem;
  }

  h2::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    margin-top: calc(0.65em - 5px);
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }
</style>
