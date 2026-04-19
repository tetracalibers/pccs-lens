<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"
  import JisColorNameTooltip from "./JisColorNameTooltip.svelte"

  let { color }: { color: JISColor } = $props()

  const anchorName = $derived(`--jis-tt-${color.id}`)
  const popoverId = $derived(`jis-tt-${color.id}`)

  let popoverRef: HTMLElement | null = $state(null)

  const show = () => popoverRef?.showPopover()
  const hide = () => popoverRef?.hidePopover()

  // 縦長の亀甲型（上下が頂点、左右が平辺）
  const POLY_POINTS = "50,5 93.3,27.5 93.3,72.5 50,95 6.7,72.5 6.7,27.5"
</script>

<div class="wrap" style:anchor-name={anchorName}>
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon
      points={POLY_POINTS}
      fill={color.hex}
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
  }

  polygon:focus-visible {
    stroke: var(--color-focus, #4a90e2);
    stroke-width: 3;
  }
</style>
