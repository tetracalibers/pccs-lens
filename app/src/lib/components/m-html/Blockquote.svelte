<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="blockquote-wrapper">
  <blockquote>
    {@render children?.()}
  </blockquote>
</div>

<style>
  .blockquote-wrapper {
    position: relative;
    margin-inline: 1rem;
    margin-block: 1.5rem;
  }

  .blockquote-wrapper:before {
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

  blockquote {
    padding-block: 1rem;
    padding-block-start: 2rem;
    padding-inline-start: 2rem;
    padding-inline-end: 1.5rem;
    box-sizing: border-box;
    color: var(--color-body);
    background: #e0e0e0;
    margin: 0;
    clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%, 0 40px);
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
