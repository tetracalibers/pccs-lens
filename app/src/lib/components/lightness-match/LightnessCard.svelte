<script lang="ts">
  import Icon from "@iconify/svelte"
  import LightnessAxis from "./LightnessAxis.svelte"
  import { isNearMiss, type CandidateColor } from "$lib/games/lightness-match/round"

  interface Props {
    candidate: CandidateColor
    baseValue: number
    baseColor: string
    baseName: string
    baseNameSegments?: string[]
    flipped: boolean
    index: number
    onselect: (index: number) => void
  }

  let {
    candidate,
    baseValue,
    baseColor,
    baseName,
    baseNameSegments,
    flipped,
    index,
    onselect
  }: Props = $props()

  // 慣用色名を最大 2 行に分ける。nameSegments があればそれを行として使い、なければ 1 行。
  const toNameLines = (name: string, segments?: string[]): string[] => {
    if (!segments || segments.length < 2) return [name]
    if (segments.length === 2) return segments
    const mid = Math.ceil(segments.length / 2)
    return [segments.slice(0, mid).join(""), segments.slice(mid).join("")]
  }

  const baseNameLines = $derived(toNameLines(baseName, baseNameSegments))
  const selectedNameLines = $derived(
    toNameLines(candidate.color.name, candidate.color.nameSegments)
  )

  const nearMiss = $derived(!candidate.isCorrect && isNearMiss(baseValue, candidate.value))
  const verdict = $derived(
    candidate.isCorrect ? "correct" : nearMiss ? "near" : ("wrong" as "correct" | "near" | "wrong")
  )
  const verdictLabel = $derived(
    verdict === "correct" ? "正解" : verdict === "near" ? "惜しい！" : "不正解"
  )

  // 基準色との明度差（マンセル Value 差）。0 なら一致＝正解。
  const valueDiff = $derived(Math.abs(baseValue - candidate.value))
</script>

<div class="card" class:flipped>
  <div class="inner">
    <!-- 表：色だけを見せて明度を判断させる。クリックでめくる。 -->
    <button
      type="button"
      class="face front"
      style="background: {candidate.color._hex}"
      aria-label="候補 {index + 1}。めくって明度を確かめる"
      disabled={flipped}
      onclick={() => onselect(index)}
    >
      <span class="peek" aria-hidden="true"><Icon icon="si:click-duotone" /></span>
    </button>

    <!-- 裏：結果と明度差の可視化 -->
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
        {#if verdict === "correct"}
          <Icon icon="mdi:check-circle" />
        {:else if verdict === "near"}
          <Icon icon="mdi:approximately-equal" />
        {:else}
          <Icon icon="mdi:close-circle" />
        {/if}
        {verdictLabel}
      </span>

      {#if flipped}
        <span class="axis-wrap">
          <LightnessAxis
            {baseValue}
            {baseColor}
            {baseNameLines}
            selectedValue={candidate.value}
            selectedColor={candidate.color._hex}
            {selectedNameLines}
          />
        </span>
      {/if}

      <span class="meta">
        <span class="diff-label">明度差</span>
        <span class="diff-value">{valueDiff}</span>
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
    aspect-ratio: 3 / 4;
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
    padding: 0.5rem 0.4rem;
  }

  .verdict {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    margin-top: 0.4rem;
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

  .verdict-near {
    color: light-dark(#ef8c00, #ffc266);
  }

  .verdict-wrong {
    color: light-dark(#e03131, #ff8787);
  }

  .axis-wrap {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.2;
    text-align: center;
  }

  .diff-label {
    font-size: 0.66rem;
    color: var(--color-body);
  }

  .diff-value {
    font-size: 0.85rem;
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
