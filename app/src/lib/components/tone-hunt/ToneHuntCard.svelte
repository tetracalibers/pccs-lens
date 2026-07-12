<script lang="ts">
  import GameCard from "$lib/components/games/GameCard.svelte"
  import ToneDiagram from "$lib/components/analyze/ToneDiagram.svelte"
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
  const cls = $derived(toneClass(toneSymbol))
  const classLabel = $derived(cls ? TONE_CLASS_LABEL[cls] : "")

  const verdict = $derived(candidate.isCorrect ? "correct" : "wrong")
  const verdictLabel = $derived(candidate.isCorrect ? "正解" : "不正解")
</script>

<GameCard
  hex={candidate.color.hex}
  {flipped}
  {index}
  {onselect}
  showFlipBack={!candidate.isCorrect}
  {verdict}
  {verdictLabel}
  frontAriaLabel="候補 {index + 1}。めくってトーンを確かめる"
  aspectRatio="3 / 4.4"
>
  <!-- 裏面：トーンマップ上の位置と、PCCS 記号／分類。 -->
  <span class="body">
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
      <span class="notation">{candidate.color.notation}</span>
      <span class="sep">／</span>
      <span class="cls">{classLabel}</span>
    </span>
  </span>
</GameCard>

<style>
  .body {
    display: grid;
    grid-template-rows: 1fr auto;
    align-items: center;
    justify-items: center;
    gap: 0.3rem;
    width: 100%;
    min-height: 0;
  }

  .map-wrap {
    width: 100%;
    min-height: 0;
    display: grid;
    place-items: center;
    padding: 0.1rem 0.15rem;
  }

  .map-wrap :global(.diagram-wrapper) {
    display: block;
    width: 100%;
    max-width: 168px;
  }

  .meta {
    display: grid;
    grid-auto-flow: column;
    align-items: baseline;
    justify-content: center;
    gap: 0.3rem;
    line-height: 1.25;
    text-align: center;
  }

  .meta .notation {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-heading);
  }

  .meta .sep {
    opacity: 0.6;
  }

  .meta .cls {
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--color-heading);
  }
</style>
