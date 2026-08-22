<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    /** AIが追加・編集した文面であることを示す。人手で直したら外す（公開時チェックのゲート対象） */
    fixme?: boolean
    children?: Snippet
  }

  let { fixme = false, children }: Props = $props()
</script>

<div class="action" class:fixme>
  <div class="label">
    {#if fixme}<span class="marker">!</span>{/if}
    {fixme ? "ACTION：要編集" : "Action"}
  </div>
  {@render children?.()}
</div>

<style>
  .action {
    margin: 1.05rem 0;
    margin-inline-start: 0.25rem;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 2px solid transparent;
    border-image: linear-gradient(to top, #ff9a9e, #f953c6) 1;
    position: relative;
    font-size: 0.88rem;
    line-height: 1.7;
  }

  /* AIが書いた下書き。ボーダーのグラデーションは残したまま、点線にして要編集を示す */
  .action.fixme {
    border-image: none;
    border-left-color: transparent;
  }
  .action.fixme::before {
    content: "";
    position: absolute;
    inset-block: 0;
    left: -2px;
    width: 2px;
    background: linear-gradient(to top, #ff9a9e, #f953c6);
    mask-image: repeating-linear-gradient(to bottom, #000 0 3px, transparent 3px 6px);
  }
  .action.fixme :global(*) {
    font-size: 0.8rem;
  }
  .action.fixme .label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: light-dark(#a0005a, #ff9a9e);
    margin-bottom: 0.25rem;
    opacity: 0.85;
  }

  /* :::Edit と同じ `!` */
  .marker {
    font-size: 0.8rem;
  }

  .action :global(p) {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: var(--color-body);
  }
</style>
