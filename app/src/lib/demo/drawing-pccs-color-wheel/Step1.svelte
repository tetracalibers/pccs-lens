<script lang="ts">
  import type { Snippet } from "svelte"
  import { CX, CY, R, STROKE_WIDTH, COL_LINE, VIEW_SIZE, tickEndpoints } from "./constants"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // 12時, 3時, 6時, 9時 (SVG y-down: 270°, 0°, 90°, 180°)
  const majorTickAngles = [270, 0, 90, 180]
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}">
  <defs>
    {@render extraDefs?.()}
  </defs>

  <!-- 円 -->
  <circle cx={CX} cy={CY} r={R} fill="none" stroke={COL_LINE} stroke-width={STROKE_WIDTH} />

  <!-- 十字の主目盛り -->
  {#each majorTickAngles as ang (ang)}
    {@const e = tickEndpoints(ang)}
    <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={COL_LINE} stroke-width={STROKE_WIDTH} />
  {/each}

  {@render extraContent?.()}
</svg>
