<script lang="ts">
  import Icon from "@iconify/svelte"
  import LightnessAxis from "./LightnessAxis.svelte"
  import { isNearMiss, type CandidateColor } from "$lib/games/lightness-match/round"

  interface Props {
    candidate: CandidateColor
    baseValue: number
    baseColor: string
    baseName: string
    flipped: boolean
    index: number
    onselect: (index: number) => void
  }

  let { candidate, baseValue, baseColor, baseName, flipped, index, onselect }: Props = $props()

  const nearMiss = $derived(!candidate.isCorrect && isNearMiss(baseValue, candidate.value))
  const verdict = $derived(
    candidate.isCorrect ? "correct" : nearMiss ? "near" : ("wrong" as "correct" | "near" | "wrong")
  )
  const verdictLabel = $derived(
    verdict === "correct" ? "正解" : verdict === "near" ? "惜しい！" : "不正解"
  )
  // 見つけた正解は確定（再クリックで戻せない）。不正解は表に戻して選び直せる。
  const locked = $derived(flipped && candidate.isCorrect)

  const ariaLabel = $derived(
    flipped
      ? `候補 ${index + 1}：${candidate.color.name}。${verdictLabel}`
      : `候補 ${index + 1}。めくって明度を確かめる`
  )
</script>

<button
  type="button"
  class="card"
  class:flipped
  aria-pressed={flipped}
  aria-label={ariaLabel}
  disabled={locked}
  onclick={() => onselect(index)}
>
  <span class="inner">
    <!-- 表：色だけを見せて明度を判断させる -->
    <span class="face front" style="background: {candidate.color._hex}">
      <span class="peek" aria-hidden="true"><Icon icon="mdi:magnify" /></span>
    </span>

    <!-- 裏：結果と明度差の可視化 -->
    <span class="face back">
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
            {baseName}
            selectedValue={candidate.value}
            selectedColor={candidate.color._hex}
            selectedName={candidate.color.name}
          />
        </span>
      {/if}

      <span class="meta">
        <span class="name">{candidate.color.name}</span>
        <span class="munsell">{candidate.color.munsell}</span>
      </span>
    </span>
  </span>
</button>

<style>
  .card {
    /* card-back 内で使う局所トークン（未定義環境でも読めるようフォールバック付き） */
    --_surface: var(--color-surface, light-dark(#ffffff, #16161f));
    --_border: var(--color-border, light-dark(#e0e0e0, #2e2e3e));

    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    padding: 0;
    border: none;
    background: none;
    perspective: 900px;
    cursor: pointer;
    font: inherit;
    color: var(--color-heading);
  }

  .card:disabled {
    cursor: default;
  }

  .card:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 3px;
    border-radius: 12px;
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
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  }

  .peek {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.1rem;
    color: rgba(0, 0, 0, 0.35);
    background: rgba(255, 255, 255, 0.35);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .card:hover .front .peek,
  .card:focus-visible .front .peek {
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
    color: light-dark(#e8590c, #ffa94d);
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
    line-height: 1.25;
    text-align: center;
  }

  .name {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-heading);
  }

  .munsell {
    font-size: 0.66rem;
    font-family: var(--font-mono, monospace);
    color: var(--color-body);
  }

  /* 動きを減らす設定を尊重する */
  @media (prefers-reduced-motion: reduce) {
    .inner {
      transition: none;
    }
  }
</style>
