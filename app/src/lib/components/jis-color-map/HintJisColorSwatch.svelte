<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import type { JISColor } from "$lib/data/jis-colors"

  interface Props {
    color: JISColor
    variant?: "fill" | "outline"
  }

  let { color, variant = "fill" }: Props = $props()

  const title = $derived(`${color.name}（${color.reading}）`)

  const labelLines = $derived(color.nameSegments ?? [color.name])
  const labelInside = $derived(labelLines.every((line) => line.length <= 3))
  const insideTextColor = $derived(isLightColor(color.rgb) ? "#333" : "#fff")

  // 正六角形の亀甲型（上下が頂点、左右が平辺）
  // 外接円半径 50、幅 = 50 * √3 ≒ 86.6、高さ = 100
  const POLY_POINTS = "43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
</script>

<div class="wrap" style:--_jis-color-rgb={color.rgb} {title}>
  <div
    class="label"
    class:--_inside={labelInside}
    style:color={labelInside ? insideTextColor : undefined}
  >
    {#each labelLines as line, i (i)}
      {line}
      {#if i < labelLines.length - 1}<br />{/if}
    {/each}
  </div>
  <svg viewBox="0 0 86.6 100" xmlns="http://www.w3.org/2000/svg">
    <polygon class:--_outline={variant === "outline"} points={POLY_POINTS} />
  </svg>
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
    height: 100%;
    line-height: 0;
  }

  .label {
    position: absolute;
    bottom: calc(100% + 0.25em);
    left: 50%;
    transform: translateX(-50%);
    line-height: 1.1;
    font-size: var(--map-font-xs, 0.55rem);
    font-family: var(--font-round);
    color: var(--color-body);
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }

  .label.--_inside {
    top: 50%;
    bottom: auto;
    transform: translate(-50%, -50%);
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  polygon {
    fill: var(--_jis-color-rgb);
  }

  polygon.--_outline {
    fill: none;
    stroke: var(--_jis-color-rgb);
    stroke-width: 4;
  }
</style>
