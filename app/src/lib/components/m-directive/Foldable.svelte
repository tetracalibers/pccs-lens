<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    collapsed?: boolean | "true" | "false"
    children?: Snippet
  }

  let { title, collapsed = true, children }: Props = $props()

  /** ディレクティブの属性値は文字列で渡るため、`"false"` も偽として扱う */
  const isCollapsed = $derived(collapsed !== false && collapsed !== "false")
</script>

<details class="foldable" open={!isCollapsed}>
  <summary class="foldable-title">{title}</summary>
  <div class="foldable-body">
    {@render children?.()}
  </div>
</details>

<style>
  .foldable {
    margin-block-start: 1rem;
    margin-block-end: 1.25rem;
  }

  .foldable-title {
    /* summary 既定の三角マーカーを消して自前のマーカーに置き換える */
    display: block;
    list-style: none;
    /* マーカー分をぶら下げインデントにして、折り返した行を文頭にそろえる */
    text-indent: -1rem;
    padding-inline-start: 1rem;
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1.7;
    color: var(--color-heading);
  }

  .foldable-title::-webkit-details-marker {
    display: none;
  }

  .foldable-title::before {
    content: "";
    display: inline-block;
    width: 0;
    height: 0;
    margin-inline-end: 0.55rem;
    border-block: 0.3rem solid transparent;
    border-inline-start: 0.42rem solid currentColor;
    opacity: 0.7;
  }

  .foldable[open] .foldable-title::before {
    rotate: 90deg;
  }

  .foldable-body {
    padding-block-start: 0.5rem;
  }

  .foldable-body > :global(:first-child) {
    margin-block-start: 0;
  }

  .foldable-body > :global(:last-child) {
    margin-block-end: 0;
  }
</style>
