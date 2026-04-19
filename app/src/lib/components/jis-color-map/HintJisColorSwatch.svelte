<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"

  interface Props {
    color: JISColor
    variant?: "fill" | "outline"
  }

  let { color, variant = "fill" }: Props = $props()

  const title = $derived(`${color.name}（${color.reading}）`)

  // 正六角形の亀甲型（上下が頂点、左右が平辺）
  // 外接円半径 50、幅 = 50 * √3 ≒ 86.6、高さ = 100
  const POLY_POINTS = "43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
</script>

<div class="wrap" style:--_jis-color-hex={color.hex} {title}>
  <svg viewBox="0 0 86.6 100" xmlns="http://www.w3.org/2000/svg">
    <polygon class:--_outline={variant === "outline"} points={POLY_POINTS} />
  </svg>
</div>

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
    fill: var(--_jis-color-hex);
  }

  polygon.--_outline {
    fill: none;
    stroke: var(--_jis-color-hex);
    stroke-width: 4;
  }
</style>
