<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    NUM_FONT_SIZE,
    STROKE_WIDTH,
    arcColor,
    arcPath,
    fillBandPath,
    fillColor,
    hueAngle,
    numberPosition,
    tickEndpoints
  } from "./constants"
  import Step6 from "./Step6.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
    extraUnderlay?: Snippet
  }

  let { extraDefs, extraContent, extraUnderlay }: Props = $props()

  // R/Y/G 系の両側 + B 系の右端 (17 は Step6 で追加済み)
  const newOddTicks = [1, 3, 7, 9, 11, 13, 19]

  // 4つの円弧 (各円系の両端を結ぶ). 円弧の色は中心となる丸囲み色相の色.
  const arcs = [
    { from: 1, to: 3, centerHue: 2 },
    { from: 7, to: 9, centerHue: 8 },
    { from: 11, to: 13, centerHue: 12 },
    { from: 16, to: 19, centerHue: 18 }
  ]
</script>

{#snippet defs()}
  {#each arcs as arc (arc.centerHue)}
    {@const c = arcColor(arc.centerHue)}
    <marker
      id="arc-arrow-start-{arc.centerHue}"
      markerWidth="6"
      markerHeight="6"
      refX="1"
      refY="3"
      orient="auto"
    >
      <polyline
        points="5,1 1,3 5,5"
        fill="none"
        stroke={c}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker
      id="arc-arrow-end-{arc.centerHue}"
      markerWidth="6"
      markerHeight="6"
      refX="5"
      refY="3"
      orient="auto"
    >
      <polyline
        points="1,1 5,3 1,5"
        fill="none"
        stroke={c}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
  {/each}
  {@render extraDefs?.()}
{/snippet}

{#snippet underlay()}
  {#each arcs as arc (arc.from)}
    <path d={fillBandPath(arc.from, arc.to)} fill={fillColor(arc.centerHue)} />
  {/each}
  {@render extraUnderlay?.()}
{/snippet}

{#snippet content()}
  {#each newOddTicks as hue (hue)}
    {@const ang = hueAngle(hue)}
    {@const e = tickEndpoints(ang)}
    {@const np = numberPosition(ang)}
    <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={COL_LINE} stroke-width={STROKE_WIDTH} />
    <text
      x={np.x}
      y={np.y}
      font-size={NUM_FONT_SIZE}
      fill={COL_TEXT}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {hue}
    </text>
  {/each}
  {#each arcs as arc (arc.from)}
    <path
      d={arcPath(arc.from, arc.to)}
      fill="none"
      stroke={arcColor(arc.centerHue)}
      stroke-width={STROKE_WIDTH}
      marker-start="url(#arc-arrow-start-{arc.centerHue})"
      marker-end="url(#arc-arrow-end-{arc.centerHue})"
    />
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step6 extraDefs={defs} extraContent={content} extraUnderlay={underlay} />
