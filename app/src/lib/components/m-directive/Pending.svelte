<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="pending">
  <div class="label">
    <span class="marker">-</span>
    (保留中)
  </div>
  {@render children?.()}
</div>

<style>
  /* 消すかどうかの検討に使うので :::Delete と同じ赤い帯。ラベルの「(保留中)」で区別する */
  .pending {
    position: relative;
    margin: 1.05rem 0;
    padding: 0.5rem 0.8rem;
    padding-inline-start: calc(0.8rem + 1.25rem);
    border-radius: 0 2px 2px 0;
    background: light-dark(#ffebe9, rgb(248 81 73 / 0.24));
    font-size: 0.8rem;
    line-height: 1.7;
  }

  .label {
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#cf222e, #f85149);
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  /* diff の削除行と同じ `-` を、ガター相当の位置に置く */
  .marker {
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-start: 0.8rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .pending :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }

  .pending :global(p + p) {
    margin-block-start: 0.5rem;
  }
</style>
