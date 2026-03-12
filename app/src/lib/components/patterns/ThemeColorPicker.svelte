<script lang="ts">
  import type { SuggestOutput, SelectedColor } from "$lib/patterns/types"
  import HueSelector from "./HueSelector.svelte"
  import ToneSelector from "./ToneSelector.svelte"

  let {
    label,
    description,
    selectedColor,
    suggest,
    allowedHues,
    allowedTones,
    onchange
  }: {
    label: string
    description: string
    selectedColor: SelectedColor
    suggest: SuggestOutput
    allowedHues: number[]
    allowedTones: string[]
    onchange: (color: SelectedColor) => void
  } = $props()

  const ACHROMATIC_TONES = new Set(["W", "ltGy", "mGy", "dkGy", "Bk"])

  const isAchromaticSelected = $derived(
    selectedColor.hueNumber === null || ACHROMATIC_TONES.has(selectedColor.toneSymbol)
  )

  function onHueSelect(hue: number) {
    if (isAchromaticSelected) {
      // §1-9: 有彩色への切り替え → サジェストの有彩色トーンからランダム選択
      const chromaticSuggestedTones = suggest.suggestedTones.filter((t) => !ACHROMATIC_TONES.has(t))
      const chromaticAllowedTones = allowedTones.filter((t) => !ACHROMATIC_TONES.has(t))
      const pool =
        chromaticSuggestedTones.length > 0 ? chromaticSuggestedTones : chromaticAllowedTones
      const tone = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : "p"
      onchange({ hueNumber: hue, toneSymbol: tone })
    } else {
      onchange({ hueNumber: hue, toneSymbol: selectedColor.toneSymbol })
    }
  }

  function onToneSelect(tone: string) {
    if (ACHROMATIC_TONES.has(tone)) {
      onchange({ hueNumber: null, toneSymbol: tone })
    } else {
      // 有彩色トーンを選択した場合、hueNumber が null なら最初のサジェスト色相を使う
      const hue =
        selectedColor.hueNumber !== null
          ? selectedColor.hueNumber
          : (suggest.suggestedHues[0] ?? allowedHues[0] ?? 1)
      onchange({ hueNumber: hue, toneSymbol: tone })
    }
  }
</script>

<div class="picker">
  <div class="picker-header">
    <span class="picker-label">{label}</span>
    <span class="picker-description">{description}</span>
  </div>

  <div class="selectors">
    <div class="selector-section">
      <span class="selector-title">色相</span>
      <div class="hue-wrapper">
        <HueSelector
          value={isAchromaticSelected ? null : selectedColor.hueNumber}
          suggestedHues={suggest.suggestedHues}
          {allowedHues}
          onselect={onHueSelect}
        />
      </div>
    </div>

    <div class="selector-section">
      <span class="selector-title">トーン</span>
      <div class="tone-wrapper">
        <ToneSelector
          value={selectedColor.toneSymbol}
          suggestedTones={suggest.suggestedTones}
          {allowedTones}
          onselect={onToneSelect}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .picker-header {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .picker-label {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .picker-description {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #666);
  }

  .selectors {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .selector-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .selector-title {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #777);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .hue-wrapper {
    width: 160px;
  }

  .tone-wrapper {
    /* ToneSelector の SVG サイズに合わせて幅を抑える */
    max-width: 220px;
  }
</style>
