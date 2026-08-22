<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    /** 変更対象。`threejs`: Three.jsデモ / `svg`: SVG図版 */
    target?: "threejs" | "svg"
    children?: Snippet
  }

  let { target = "threejs", children }: Props = $props()

  const TARGET_LABELS: Record<string, string> = {
    threejs: "demo (Three.js)",
    svg: "figure (SVG)"
  }

  /** ディレクティブの属性値は文字列で渡るため、想定外の値は既定のThree.jsデモに倒す */
  const targetLabel = $derived(TARGET_LABELS[target] ?? TARGET_LABELS.threejs)
</script>

<div class="modify">
  <div class="label">
    <span class="marker">!</span>
    {targetLabel}
  </div>
  {@render children?.()}
</div>

<style>
  /* :::Edit と同じ帯のかたち。文章ではなくデモ・図版への指示なので石板色で塗り分ける */
  .modify {
    position: relative;
    margin: 1.05rem 0;
    padding: 0.5rem 0.8rem;
    padding-inline-start: calc(0.8rem + 1.25rem);
    border-radius: 0 2px 2px 0;
    background: light-dark(#eef1f5, rgb(119 136 153 / 0.24));
    font-size: 0.8rem;
    line-height: 1.7;
    text-transform: uppercase;
  }
  .modify :global(*) {
    font-size: 0.8rem;
  }

  .label {
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#546679, #a3b3c4);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  /* context diff が変更行に使う `!` を、ガター相当の位置に置く */
  .marker {
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-start: 0.8rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .modify :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
