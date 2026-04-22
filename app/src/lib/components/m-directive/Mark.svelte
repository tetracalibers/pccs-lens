<script lang="ts">
  import type { Snippet } from "svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<span class="mark" class:anki={ankiMode.isAnki}>
  {@render children?.()}
</span>

<style>
  .mark {
    font-weight: 700;
    color: light-dark(#6b23a8, #e8c8ff);
    display: inline-block;
    margin-inline: 0.1rem;
    line-height: 1.5;
  }

  .mark.anki {
    color: transparent;
    text-decoration: underline;
    text-decoration-color: darkgray;
    text-decoration-thickness: 2px;
    text-decoration-skip-ink: none;
  }
</style>
