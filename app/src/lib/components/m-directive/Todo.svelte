<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    /** `figure`: 図解・デモを入れたい箇所 / `fix`: 記述を直したい箇所（加筆したい箇所は `:::Add`） */
    type?: "figure" | "fix"
    children?: Snippet
  }

  let { type = "figure", children }: Props = $props()

  /** ディレクティブの属性値は文字列で渡るため、既定の図解以外は明示された値のみ */
  const isFigure = $derived(type !== "fix")
</script>

<div class="todo" class:figure={isFigure}>
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
    content: "TODO：修正";
    display: block;
    font-family: var(--font-mono-base), var(--font-ja-base);
    color: light-dark(#1a7f37, #3fb950);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  /** 図解のTODOだけを数えて、ページ内での通し番号をタイトルに出す */
  .todo.figure {
    counter-increment: todo-figure;
  }

  .todo.figure::before {
    content: "TODO：図解." counter(todo-figure);
  }

  .todo :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
