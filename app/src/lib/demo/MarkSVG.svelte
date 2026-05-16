<script lang="ts">
  import type { Snippet } from "svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<tspan class="mark" class:anki={ankiMode.isAnki}>{@render children?.()}</tspan>

<style>
  .mark {
    font-weight: 500;
    font-family: var(--font-mark);
    fill: var(--color-anki);
  }

  .mark.anki {
    fill: transparent;
    text-decoration: underline;
    text-decoration-color: darkgray;
    text-decoration-thickness: 2px;
    text-decoration-skip-ink: none;
  }
</style>
