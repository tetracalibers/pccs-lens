<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="pending">
  <div class="label">
    <span class="marker">?</span>
    PENDING
  </div>
  {@render children?.()}
</div>

<style>
  /* :::Add / :::Delete / :::Fix と同じ帯のかたち。採否が未決なので無彩色で塗る */
  .pending {
    position: relative;
    margin: 1.05rem 0;
    padding: 0.5rem 0.8rem;
    padding-inline-start: calc(0.8rem + 1.25rem);
    border-radius: 0 2px 2px 0;
    background: light-dark(#f2f3f5, rgb(139 148 158 / 0.24));
    font-size: 0.8rem;
    line-height: 1.7;
  }

  .label {
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#57606a, #9198a1);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  /* ndiff がヒント行に使う `?` を、ガター相当の位置に置く */
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
