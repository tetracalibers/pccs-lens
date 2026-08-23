<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="edit">
  {@render children?.()}
</div>

<style>
  /* :::Add / :::Delete と同じ帯のかたち。「あるものを直す」ので琥珀で塗る */
  .edit {
    margin: 1.05rem 0;
    padding: 0.5rem 0.75rem 0.4rem;
    border-radius: 0 2px 2px 0;
    background: light-dark(#fff8c5, rgb(210 153 34 / 0.24));
    font-size: 0.8rem;
    line-height: 1.7;
  }
  .edit :global(*) {
    font-size: 0.8rem;
  }

  /* context diff が変更行に使う `!` を、ガター相当の位置に各段落ごとぶら下げる */
  .edit :global(p) {
    position: relative;
    margin: 0;
    padding-inline-start: 1.25rem;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }

  .edit :global(p)::before {
    content: "!";
    position: absolute;
    inset-inline-start: 0;
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#9a6700, #d29922);
    line-height: 1.5;
  }

  .edit :global(p + p) {
    margin-block-start: 0.5rem;
  }
</style>
