<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    /** `figure`: 図解・デモを入れたい箇所 / `text`: 文章を加筆したい箇所 */
    type?: "figure" | "text"
    children?: Snippet
  }

  let { type = "figure", children }: Props = $props()

  /** ディレクティブの属性値は文字列で渡るため、既定の図解以外は明示された `text` のみ */
  const isFigure = $derived(type !== "text")
</script>

<div class="todo" class:figure={isFigure}>
  {@render children?.()}
</div>

<style>
  .todo {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px dashed light-dark(#a3a8b4, #6e747f);
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  .todo::before {
    content: "TODO：追記";
    display: block;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: light-dark(#6b7280, #a3a8b4);
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
