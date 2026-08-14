<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="delete">
  {@render children?.()}
</div>

<style>
  /* GitHub の diff の削除行に倣い、赤い帯と行頭の `-` で「消す予定の記述」を示す */
  .delete {
    margin: 1.05rem 0;
    padding: 0.35rem 0.75rem;
    border-radius: 0 2px 2px 0;
    background: light-dark(#ffebe9, rgb(248 81 73 / 0.15));
    font-size: 0.8rem;
    line-height: 1.7;
  }

  /* diff のガター相当の `-` を、各段落の行頭にぶら下げる */
  .delete :global(p) {
    position: relative;
    margin: 0;
    padding-inline-start: 1.25rem;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }

  .delete :global(p)::before {
    content: "-";
    position: absolute;
    inset-inline-start: 0;
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#cf222e, #f85149);
  }

  .delete :global(p + p) {
    margin-block-start: 0.5rem;
  }
</style>
