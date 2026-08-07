<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<!-- 強調のみを担うマーク。暗記モードでも伏せ字にならない（伏せたいときは Anki を使う） -->
<span class="mark">
  {@render children?.()}
</span>

<style>
  .mark {
    font-weight: 500;
    font-family: var(--font-mark);
    color: var(--color-anki);
    display: inline-block;
    margin-inline: 0.1rem;
    line-height: 1.5;
  }
</style>
