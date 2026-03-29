<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<ul>
  {@render children?.()}
</ul>

<style>
  ul {
    margin: 0.75rem 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  ul :global(li) {
    font-size: 0.9rem;
    color: light-dark(#556070, #9090b0);
    line-height: 1.7;
    padding-left: 1.4rem;
    position: relative;
  }

  ul :global(li::before) {
    content: "◆";
    position: absolute;
    left: 0.05rem;
    top: 0;
    color: light-dark(#6d28d9, #c4b5fd);
    font-size: 0.5em;
    line-height: 3.4;
  }
</style>
