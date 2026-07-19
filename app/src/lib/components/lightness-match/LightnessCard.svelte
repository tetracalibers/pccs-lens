<script lang="ts">
  import GameCard from "$lib/components/games/GameCard.svelte"
  import LightnessAxis from "./LightnessAxis.svelte"
  import { grayHexForLightness } from "$lib/color/lightnessContrast"
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
    /** ヒント ON なら表面の下半分を Value 由来グレーで塗る。 */
    hint?: boolean
  }

  let {
    candidate,
    baseValue,
    baseColor,
    baseName,
    baseNameSegments,
    flipped,
    index,
    onselect,
    hint = false
  }: Props = $props()

  // ヒント時の下半分グレー。マンセル Value → L*≈Value×10 で明度軸と同一換算のグレーにする。
  const hintHex = $derived(hint ? grayHexForLightness(candidate.value * 10) : undefined)

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

  // 基準色との明度差（マンセル Value 差）。符号付きで、基準より低ければ負・高ければ正。0 なら一致＝正解。
  const valueDiff = $derived(candidate.value - baseValue)
  const valueDiffLabel = $derived(valueDiff > 0 ? `+${valueDiff}` : String(valueDiff))
</script>

<GameCard
  hex={candidate.color._hex}
  {hintHex}
  {flipped}
  {index}
  {onselect}
  showFlipBack={!candidate.isCorrect}
  {verdict}
  {verdictLabel}
  frontAriaLabel="候補 {index + 1}。めくって明度を確かめる"
>
  <!-- 裏面：明度差の可視化（明度軸＝main）と明度差の数値（footer）。 -->
  {#snippet main()}
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
  {/snippet}
  {#snippet footer()}
    <span class="meta">
      <span class="diff-label">明度差</span>
      <span class="diff-value">{valueDiffLabel}</span>
    </span>
  {/snippet}
</GameCard>

<style>
  .axis-wrap {
    width: 100%;
    min-height: 0;
    display: grid;
    place-items: center;
  }

  .meta {
    display: grid;
    justify-items: center;
    gap: 2px;
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
</style>
