<script lang="ts">
  import GameCard from "$lib/components/games/GameCard.svelte"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isNearMissTone, toneNameJa, type CandidateColor } from "$lib/games/tone-match/round"

  interface Props {
    candidate: CandidateColor
    /** お題トーン（正誤・惜しい判定に使う）。 */
    target: string
    flipped: boolean
    index: number
    onselect: (index: number) => void
  }

  let { candidate, target, flipped, index, onselect }: Props = $props()

  const toneSymbol = $derived(candidate.color.toneSymbol)
  const toneName = $derived(toneNameJa(toneSymbol))
  const hueName = $derived(
    candidate.color.hueNumber !== null
      ? (PCCS_HUE_MAP.get(candidate.color.hueNumber)?.labelJa ?? "")
      : ""
  )

  const nearMiss = $derived(!candidate.isCorrect && isNearMissTone(target, toneSymbol))
  const verdict = $derived(
    candidate.isCorrect ? "correct" : nearMiss ? "near" : ("wrong" as "correct" | "near" | "wrong")
  )
  const verdictLabel = $derived(
    verdict === "correct" ? "正解" : verdict === "near" ? "惜しい！" : "不正解"
  )
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
>
  <!-- 裏面：実トーン（記号＋和名）と PCCS 記号。トーンマップ上の位置などは載せない。 -->
  <span class="body">
    <span class="tone">
      <span class="tone-symbol">{toneSymbol}</span>
      <span class="tone-name">{toneName}</span>
    </span>
    <span class="identity">
      <span class="notation">{candidate.color.notation}</span>
      {#if hueName}
        <span class="sep">／</span>
        {hueName}
      {/if}
    </span>
  </span>
</GameCard>

<style>
  .body {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .tone {
    display: grid;
    justify-items: center;
    gap: 0.15rem;
    line-height: 1.1;
  }

  .tone-symbol {
    font-family: var(--font-mono);
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--color-heading);
  }

  .tone-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--color-body);
  }

  .identity {
    font-size: 0.64rem;
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
</style>
