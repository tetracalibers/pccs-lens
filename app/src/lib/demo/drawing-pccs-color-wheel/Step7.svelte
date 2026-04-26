<script lang="ts">
  import type { Snippet } from "svelte"
  import { COL_LINE, STROKE_WIDTH, arcPath, hueAngle, tickEndpoints } from "./constants"
  import Step6 from "./Step6.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // R/Y/G 系の両側 + B 系の右端 (17 は Step6 で追加済み)
  const newOddTicks = [1, 3, 7, 9, 11, 13, 19]

  // 4つの円弧 (各円系の両端を結ぶ)
  const arcs = [
    { from: 1, to: 3 },
    { from: 7, to: 9 },
    { from: 11, to: 13 },
    { from: 16, to: 19 }
  ]
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  {#each newOddTicks as hue (hue)}
    {@const e = tickEndpoints(hueAngle(hue))}
    <line
      x1={e.x1}
      y1={e.y1}
      x2={e.x2}
      y2={e.y2}
      stroke={COL_LINE}
      stroke-width={STROKE_WIDTH}
    />
  {/each}
  {#each arcs as arc (arc.from)}
    <path
      d={arcPath(arc.from, arc.to)}
      fill="none"
      stroke={COL_LINE}
      stroke-width={STROKE_WIDTH}
    />
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step6 extraDefs={defs} extraContent={content} />
