<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="todo">
  {@render children?.()}
</div>

<style>
  .todo {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px dashed light-dark(#a3a8b4, #6e747f);
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .todo::before {
    content: "Todo";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#6b7280, #a3a8b4);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  .todo :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
