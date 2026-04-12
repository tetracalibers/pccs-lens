<script lang="ts">
  import type { Snippet } from "svelte"
  import { getContext } from "svelte"

  let { children }: { children?: Snippet } = $props()

  const ankiCtx = getContext<{ isAnki: boolean } | undefined>("anki-mode")
</script>

<span class="mark" class:anki={ankiCtx?.isAnki}>
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
    background-color: light-dark(#c77dff, #e8c8ff);
  }
</style>
