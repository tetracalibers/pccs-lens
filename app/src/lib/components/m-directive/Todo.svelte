<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<div class="todo">
  {@render children?.()}
</div>

<style>
  /* :::Add と同じ帯のかたち。行頭の `+` のぶんだけ中身をインデントする */
  .todo {
    position: relative;
    margin: 1.05rem 0;
    padding: 0.5rem 0.8rem;
    padding-inline-start: calc(0.8rem + 1.25rem);
    border-radius: 0 2px 2px 0;
    background: light-dark(#e6ffec, rgb(63 185 80 / 0.15));
    font-size: 0.8rem;
    line-height: 1.7;
    /** ページ内での図解の通し番号をラベルに出す */
    counter-increment: todo-figure;
  }

  /* diff のガター相当の `+` を、「TODO：」の行頭に置く */
  .todo::after {
    content: "+";
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-start: 0.8rem;
    font-family: var(--font-mono-base), var(--font-ja-base);
    font-size: 0.9rem;
    line-height: 1.3;
    color: light-dark(#1a7f37, #3fb950);
  }

  .todo::before {
    content: "TODO：図解." counter(todo-figure);
    display: block;
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#1a7f37, #3fb950);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  .todo :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
