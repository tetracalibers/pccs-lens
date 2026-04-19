<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"
  import JisColorNameTooltip from "./JisColorNameTooltip.svelte"

  interface Props {
    color: JISColor
    variant?: "fill" | "outline"
  }

  let { color, variant = "fill" }: Props = $props()

  const anchorName = $derived(`--jis-tt-${color.id}`)
  const popoverId = $derived(`jis-tt-${color.id}`)

  let popoverRef: HTMLElement | null = $state(null)

  const show = () => popoverRef?.showPopover()
  const hide = () => popoverRef?.hidePopover()

  // 正六角形の亀甲型（上下が頂点、左右が平辺）
  // 外接円半径 50、幅 = 50 * √3 ≒ 86.6、高さ = 100
  const POLY_POINTS = "43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
</script>

<div class="wrap" style:anchor-name={anchorName} style:--_jis-color-hex={color.hex}>
  <svg viewBox="0 0 86.6 100" xmlns="http://www.w3.org/2000/svg">
    <polygon
      class:--_outline={variant === "outline"}
      points={POLY_POINTS}
      tabindex="0"
      role="button"
      aria-describedby={popoverId}
      aria-label="慣用色"
      onpointerenter={show}
      onpointerleave={hide}
      onfocusin={show}
      onfocusout={hide}
    />
  </svg>
</div>

<JisColorNameTooltip colors={[color]} {anchorName} {popoverId} bind:popoverRef />

<style>
  .wrap {
    width: 100%;
    height: 100%;
    line-height: 0;
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  polygon {
    cursor: pointer;
    outline: none;
    fill: var(--_jis-color-hex);
  }

  polygon.--_outline {
    fill: none;
    stroke: var(--_jis-color-hex);
    stroke-width: 4;
  }

  polygon:focus-visible {
    stroke: var(--color-focus, #4a90e2);
    stroke-width: 3;
  }
</style>
