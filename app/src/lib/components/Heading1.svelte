<script lang="ts">
  import Icon from "@iconify/svelte"
  import type { Snippet } from "svelte"

  let {
    children,
    icon,
    grayscale = false,
    compact = false
  }: { children?: Snippet; icon: string; grayscale?: boolean; compact?: boolean } = $props()
</script>

<h1 class:grayscale class:compact>
  <Icon {icon} />
  {@render children?.()}
</h1>

<style>
  h1 {
    font-size: 2.2rem;
    font-weight: 900;
    margin: 3.5rem 0 1.25rem;
    color: var(--color-heading);
    display: flex;
    align-items: center;
    gap: 1rem;
    line-height: 1.2;
    margin-inline-start: -8px;
  }

  h1.compact {
    gap: 0.75rem;
    font-size: 2rem;
  }

  h1 :global(svg) {
    --_icon-color: light-dark(#7c3aed, #c4b5fd);

    color: var(--_icon-color);
    flex-shrink: 0;
    font-size: 3rem;
  }

  h1.grayscale :global(svg) {
    color: color-mix(in srgb, var(--_icon-color) 25%, var(--color-heading) 75%);
  }

  h1:first-of-type {
    margin-block-start: 0;
  }

  :global(.dark) h1::before {
    opacity: 0.8;
  }

  :global(.light) h1::before {
    opacity: 1;
  }
</style>
