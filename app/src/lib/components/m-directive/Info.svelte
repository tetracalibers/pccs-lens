<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="info">
  {@render children?.()}
</div>

<style>
  .info {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(180deg, #7b8eb8, #4d6090) 1;
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .info::before {
    content: "Info";
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#4a5880, #8899cc);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  .info :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
