<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    /** 修正対象。`svg`: SVG図版 / `demo`: Three.jsデモ / `text`: 文章 */
    target?: "svg" | "demo" | "text"
    children?: Snippet
  }

  let { target = "text", children }: Props = $props()

  const TARGET_LABELS: Record<string, string> = {
    svg: "図版",
    demo: "デモ",
    text: "文章"
  }

  /** ディレクティブの属性値は文字列で渡るため、想定外の値は既定の文章に倒す */
  const targetLabel = $derived(TARGET_LABELS[target] ?? TARGET_LABELS.text)
</script>

<div class="fix">
  <div class="label">
    <span class="marker">!</span>
    FIX：{targetLabel}
  </div>
  {@render children?.()}
</div>

<style>
  /* :::Add / :::Todo と同じ帯のかたち。「あるものを直す」ので琥珀で塗る */
  .fix {
    position: relative;
    margin: 1.05rem 0;
    padding: 0.5rem 0.8rem;
    padding-inline-start: calc(0.8rem + 1.25rem);
    border-radius: 0 2px 2px 0;
    background: light-dark(#fff8c5, rgb(210 153 34 / 0.24));
    font-size: 0.8rem;
    line-height: 1.7;
  }

  .label {
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#9a6700, #d29922);
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

  .fix :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
