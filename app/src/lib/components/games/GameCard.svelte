<script lang="ts">
  import type { Snippet } from "svelte"
  import Icon from "@iconify/svelte"

  interface Props {
    /** 表面に表示する色（HEX）。 */
    hex: string
    /** 裏返っているか。 */
    flipped: boolean
    /** カードの通し番号（onselect に渡す）。 */
    index: number
    /** カードを選択（めくる／表に戻す）したときのハンドラ。 */
    onselect: (index: number) => void
    /** 裏面から表へ戻すボタンを出すか（不正解カードのみ true にする運用）。 */
    showFlipBack?: boolean
    /** 正誤区分。バッジの色・アイコンに使う。 */
    verdict: "correct" | "near" | "wrong"
    /** 正誤バッジのラベル。 */
    verdictLabel: string
    /** 表面ボタンの aria-label。 */
    frontAriaLabel?: string
    /** カードの縦横比（既定 3/4。トーンマップを載せる tone-hunt などは 3/4.4）。 */
    aspectRatio?: string
    /** 裏面中央の主要内容（明度軸・トーンマップ・トーン記号など）。伸縮領域に中央寄せ。 */
    main?: Snippet
    /** 裏面下部の補足（PCCS 記号・分類・明度差など）。 */
    footer?: Snippet
  }

  let {
    hex,
    flipped,
    index,
    onselect,
    showFlipBack = false,
    verdict,
    verdictLabel,
    frontAriaLabel = "候補をめくる",
    aspectRatio = "3 / 4",
    main,
    footer
  }: Props = $props()
</script>

<div class="card" class:flipped style="aspect-ratio: {aspectRatio};">
  <div class="inner">
    <!-- 表：色だけを見せる。クリックでめくる。 -->
    <button
      type="button"
      class="face front"
      style="background: {hex}"
      aria-label={frontAriaLabel}
      disabled={flipped}
      onclick={() => onselect(index)}
    >
      <span class="peek" aria-hidden="true"><Icon icon="si:click-duotone" /></span>
    </button>

    <!-- 裏：正誤バッジ＋ゲーム固有の本文。 -->
    <div class="face back">
      {#if showFlipBack}
        <button
          type="button"
          class="flip-back"
          aria-label="表に戻す"
          disabled={!flipped}
          onclick={() => onselect(index)}
        >
          <Icon icon="eva:flip-2-outline" />
        </button>
      {/if}

      <!-- header：正誤バッジ -->
      <span class="verdict verdict-{verdict}">
        {#if verdict === "correct"}
          <Icon icon="mdi:check-circle" />
        {:else if verdict === "near"}
          <Icon icon="mdi:approximately-equal" />
        {:else}
          <Icon icon="mdi:close-circle" />
        {/if}
        {verdictLabel}
      </span>

      <!-- main：伸縮する主要領域 -->
      {#if main}
        <div class="main">{@render main()}</div>
      {/if}

      <!-- footer：下部の補足 -->
      {#if footer}
        <div class="footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    /* 裏面で使う局所トークン（未定義環境でも読めるようフォールバック付き） */
    --_surface: var(--color-surface, light-dark(#ffffff, #16161f));
    --_border: var(--color-border, light-dark(#e0e0e0, #2e2e3e));

    display: block;
    width: 100%;
    perspective: 900px;
    color: var(--color-heading);
  }

  .inner {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
    transform-style: preserve-3d;
  }

  .card.flipped .inner {
    transform: rotateY(180deg);
  }

  .face {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    overflow: hidden;
    backface-visibility: hidden;
    border: 1px solid var(--_border);
  }

  .front {
    display: grid;
    place-items: center;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    appearance: none;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  }

  .front:disabled {
    cursor: default;
  }

  .front:focus-visible,
  .flip-back:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 3px;
  }

  .peek {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.5rem;
    color: rgba(0, 0, 0, 0.35);
    background: rgba(255, 255, 255, 0.35);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .front:hover .peek,
  .front:focus-visible .peek {
    opacity: 1;
  }

  .back {
    /* header（正誤）／main（伸縮）／footer（補足）を 1 つの grid でレイアウトする。 */
    transform: rotateY(180deg);
    background: var(--_surface);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr auto;
    gap: 0.3rem;
    /* 上下対称の余白（正誤バッジの上と、本文下端の下を同じにする） */
    padding: 0.9rem 0.4rem;
  }

  .verdict {
    justify-self: center;
    display: inline-grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.85rem;
    font-weight: 800;
    line-height: 1;
  }

  .main {
    min-height: 0;
    display: grid;
    place-items: center;
  }

  .footer {
    display: grid;
    justify-items: center;
  }

  .verdict :global(svg) {
    font-size: 1.1em;
  }

  .verdict-correct {
    color: light-dark(#2f9e44, #69db7c);
  }

  .verdict-near {
    color: light-dark(#ef8c00, #ffc266);
  }

  .verdict-wrong {
    color: light-dark(#e03131, #ff8787);
  }

  .flip-back {
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 1;
    display: inline-grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid var(--_border);
    border-radius: 50%;
    background: var(--_surface);
    color: var(--color-body);
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
    transition:
      color 0.2s,
      border-color 0.2s;
  }

  .flip-back:hover:not(:disabled) {
    color: var(--color-heading);
    border-color: var(--color-heading);
  }

  /* 動きを減らす設定を尊重する */
  @media (prefers-reduced-motion: reduce) {
    .inner {
      transition: none;
    }
  }
</style>
