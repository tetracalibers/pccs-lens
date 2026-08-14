<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="add">
  {@render children?.()}
</div>

<style>
  /* GitHub の diff の追加行に倣い、緑の帯と行頭の `+` で「これから加筆する記述」を示す */
  .add {
    margin: 1.05rem 0;
    padding: 0.35rem 0.75rem;
    border-radius: 0 2px 2px 0;
    background: light-dark(#e6ffec, rgb(63 185 80 / 0.15));
    font-size: 0.8rem;
    line-height: 1.7;
  }

  /* diff のガター相当の `+` を、各段落の行頭にぶら下げる */
  .add :global(p) {
    position: relative;
    margin: 0;
    padding-inline-start: 1.25rem;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }

  .add :global(p)::before {
    content: "+";
    position: absolute;
    inset-inline-start: 0;
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#1a7f37, #3fb950);
  }

  .add :global(p + p) {
    margin-block-start: 0.5rem;
  }
</style>
