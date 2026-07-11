<script lang="ts">
  import Icon from "@iconify/svelte"
  import ToneDiagram from "$lib/components/analyze/ToneDiagram.svelte"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { PCCS_TONES } from "$lib/data/pccs-tone"
  import {
    toneClass,
    TONE_CLASS_LABEL,
    TARGET_TONES,
    type CandidateColor,
    type Mode
  } from "$lib/games/tone-hunt/round"

  interface Props {
    candidate: CandidateColor
    mode: Mode
    flipped: boolean
    index: number
    onselect: (index: number) => void
  }

  let { candidate, mode, flipped, index, onselect }: Props = $props()

  const toneSymbol = $derived(candidate.color.toneSymbol)
  const toneName = $derived(
    PCCS_TONES.find((t) => t.toneSymbol === toneSymbol)?.toneNameJa ?? toneSymbol ?? ""
  )
  const hueName = $derived(
    candidate.color.hueNumber !== null
      ? (PCCS_HUE_MAP.get(candidate.color.hueNumber)?.labelJa ?? "")
      : ""
  )
  const cls = $derived(toneClass(toneSymbol))
  const classLabel = $derived(cls ? TONE_CLASS_LABEL[cls] : "")

  const verdict = $derived(candidate.isCorrect ? "correct" : "wrong")
  const verdictLabel = $derived(candidate.isCorrect ? "正解" : "不正解")
</script>

<div class="card" class:flipped>
  <div class="inner">
    <!-- 表：色だけを見せてトーンを判断させる。クリックでめくる。 -->
    <button
      type="button"
      class="face front"
      style="background: {candidate.color.hex}"
      aria-label="候補 {index + 1}。めくってトーンを確かめる"
      disabled={flipped}
      onclick={() => onselect(index)}
    >
      <span class="peek" aria-hidden="true"><Icon icon="si:click-duotone" /></span>
    </button>

    <!-- 裏：正誤とトーンマップ上の位置 -->
    <div class="face back">
      {#if !candidate.isCorrect}
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

      <span class="verdict verdict-{verdict}">
        {#if candidate.isCorrect}
          <Icon icon="mdi:check-circle" />
        {:else}
          <Icon icon="mdi:close-circle" />
        {/if}
        {verdictLabel}
      </span>

      {#if flipped}
        <span class="map-wrap">
          <ToneDiagram
            displayedPCCSList={[candidate.color]}
            isCard199={false}
            targetTones={[...TARGET_TONES[mode]]}
            selectedTone={toneSymbol}
          />
        </span>
      {/if}

      <span class="meta">
        <span class="identity">
          <span class="notation">{candidate.color.notation}</span>
          <span class="sep">／</span>
          {hueName}
          <span class="sep">／</span>
          {toneName}
        </span>
        <span class="classify">
          <code>{toneSymbol}</code>
          {toneName}
          <span class="eq">＝</span>
          <strong class="cls">{classLabel}</strong>
        </span>
      </span>
    </div>
  </div>
</div>

<style>
  .card {
    /* card-back 内で使う局所トークン（未定義環境でも読めるようフォールバック付き） */
    --_surface: var(--color-surface, light-dark(#ffffff, #16161f));
    --_border: var(--color-border, light-dark(#e0e0e0, #2e2e3e));

    display: block;
    width: 100%;
    aspect-ratio: 3 / 4.4;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
    backface-visibility: hidden;
    border: 1px solid var(--_border);
  }

  .front {
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
    display: flex;
    align-items: center;
    justify-content: center;
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
    transform: rotateY(180deg);
    background: var(--_surface);
    gap: 0.3rem;
    padding: 0.45rem 0.4rem 0.5rem;
    justify-content: flex-start;
  }

  .verdict {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    margin-top: 0.15rem;
    font-size: 0.85rem;
    font-weight: 800;
    line-height: 1;
  }

  .verdict :global(svg) {
    font-size: 1.1em;
  }

  .verdict-correct {
    color: light-dark(#2f9e44, #69db7c);
  }

  .verdict-wrong {
    color: light-dark(#e03131, #ff8787);
  }

  .map-wrap {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.15rem;
  }

  .map-wrap :global(.diagram-wrapper) {
    display: block;
    width: 100%;
    max-width: 168px;
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    line-height: 1.25;
    text-align: center;
  }

  .identity {
    font-size: 0.66rem;
    color: var(--color-body);
  }

  .identity .notation {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-heading);
  }

  .identity .sep {
    margin: 0 0.15rem;
    opacity: 0.6;
  }

  .classify {
    font-size: 0.72rem;
    color: var(--color-body);
  }

  .classify code {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-heading);
  }

  .classify .eq {
    margin: 0 0.05rem;
    opacity: 0.7;
  }

  .classify .cls {
    font-weight: 800;
    color: var(--color-heading);
  }

  .flip-back {
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
