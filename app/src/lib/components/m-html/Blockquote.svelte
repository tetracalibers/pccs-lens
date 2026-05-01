<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<blockquote>
  {@render children?.()}
</blockquote>

<style>
  blockquote {
    position: relative;
    padding-block: 1rem;
    padding-block-start: 2rem;
    padding-inline-start: 2rem;
    padding-inline-end: 1.5rem;
    box-sizing: border-box;
    color: var(--color-body);
    background: #e0e0e0;
    margin-inline: 1rem;
    margin-block: 1.5rem;
  }

  blockquote:before {
    display: inline-block;
    position: absolute;
    top: -0.85rem;
    left: -0.75rem;
    content: "“";
    font-family: var(--font-ja);
    color: #e0e0e0;
    font-size: 4rem;
    line-height: 1;
    font-style: italic;
    z-index: 2;
  }

  blockquote:after {
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    border-width: 0 0 40px 40px;
    border-style: solid;
    border-color: transparent var(--color-bg);
  }

  blockquote :global(p) {
    position: relative;
    padding: 0;
    margin-inline: 0;
    margin-block-start: 1.5rem;
    margin-block-end: 0.75rem;
    margin: 0;
    z-index: 3;
    line-height: 1.7;
  }
</style>
