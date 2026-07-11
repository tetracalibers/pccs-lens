<script lang="ts">
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { SELECTABLE_HUES } from "$lib/games/tone-match/round"

  interface Props {
    /** 現在絞り込んでいる色相（null は全色相）。 */
    selected: number | null
    /** 色相をクリックしたときのハンドラ（同じ色相の再クリックは呼び出し側で解除）。 */
    onselect: (hue: number) => void
  }

  let { selected, onselect }: Props = $props()

  // --- 色相環の寸法（円形リング上に均等配置）---
  const SIZE = 200
  const CENTER = SIZE / 2
  const DOT_R = 15 // 色相ドットの半径
  const PAD = 4 // 外周の余白
  const RING_R = CENTER - PAD - DOT_R // ドット中心が乗るリング半径

  // 偶数 12 色相を、色相番号順に上から時計回りへ配置する。
  const DOTS = SELECTABLE_HUES.map((hue, i) => {
    const angle = (i / SELECTABLE_HUES.length) * 2 * Math.PI
    return {
      hue,
      label: PCCS_HUE_MAP.get(hue)?.labelJa ?? "",
      cx: CENTER + RING_R * Math.sin(angle),
      cy: CENTER - RING_R * Math.cos(angle)
    }
  })

  const pct = (value: number): number => (value / SIZE) * 100
  const DOT_PCT = pct(2 * DOT_R)
  const GUIDE_PCT = pct(2 * RING_R)
</script>

<div class="wheel" role="group" aria-label="色相を絞り込む色相環">
  <!-- ドット中心を通るガイド円。モノクロで色相環らしさを出すためだけの装飾。 -->
  <span class="ring-guide" style="width: {GUIDE_PCT}%;" aria-hidden="true"></span>

  {#each DOTS as dot (dot.hue)}
    {@const style = `left: ${pct(dot.cx)}%; top: ${pct(dot.cy)}%; width: ${DOT_PCT}%;`}
    <button
      type="button"
      class="dot"
      class:selected={selected === dot.hue}
      {style}
      aria-pressed={selected === dot.hue}
      aria-label="色相 {dot.hue} {dot.label}で絞り込む"
      onclick={() => onselect(dot.hue)}
    >
      {dot.hue}
    </button>
  {/each}
</div>

<style>
  .wheel {
    position: relative;
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
    aspect-ratio: 1;
  }

  .ring-guide {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    aspect-ratio: 1;
    border: 1px solid rgb(from var(--color-body) r g b / 0.18);
    border-radius: 50%;
    pointer-events: none;
  }

  .dot {
    position: absolute;
    transform: translate(-50%, -50%);
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: var(--color-surface, light-dark(#ffffff, #16161f));
    border: 1.5px solid rgb(from var(--color-body) r g b / 0.4);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-body);
    cursor: pointer;
    transition:
      transform 0.15s,
      border-color 0.2s,
      color 0.2s,
      box-shadow 0.2s;
  }

  .dot:hover {
    transform: translate(-50%, -50%) scale(1.12);
    border-color: var(--color-heading);
    color: var(--color-heading);
  }

  .dot:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 2px;
  }

  .dot.selected {
    border-color: var(--color-heading);
    color: var(--color-heading);
    font-weight: 900;
    box-shadow:
      0 0 0 3px var(--color-surface, light-dark(#ffffff, #16161f)),
      0 0 0 5px var(--color-heading);
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      transition: none;
    }
    .dot:hover {
      transform: translate(-50%, -50%);
    }
  }
</style>
