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
    top: -1rem;
    left: -1.2rem;
    content: "“";
    font-family: var(--font-ja);
    color: light-dark(#e0e0e0, var(--color-body--dark));
    font-size: 4rem;
    line-height: 1;
    font-style: italic;
  }

  blockquote {
    padding-block-end: 1.5rem;
    padding-block-start: 2rem;
    padding-inline-start: 2rem;
    padding-inline-end: 1.5rem;
    box-sizing: border-box;
    background: light-dark(#f1f1f194, #7b7b7b61);
    margin: 0;
    clip-path: polygon(2rem 0, 100% 0, 100% 100%, 0 100%, 0 2rem);
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
