<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    LETTER_CIRCLE_R,
    LETTER_FONT_SIZE,
    NUM_FONT_SIZE,
    STROKE_WIDTH,
    hueAngle,
    letterPosition,
    numberPosition,
    tickEndpoints
  } from "./constants"
  import Step5 from "./Step5.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  const tick17 = tickEndpoints(hueAngle(17))
  const num17 = numberPosition(hueAngle(17))
  const pos17 = letterPosition(17)
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  <line
    x1={tick17.x1}
    y1={tick17.y1}
    x2={tick17.x2}
    y2={tick17.y2}
    stroke={COL_LINE}
    stroke-width={STROKE_WIDTH}
  />
  <text
    x={num17.x}
    y={num17.y}
    font-size={NUM_FONT_SIZE}
    fill={COL_TEXT}
    text-anchor="middle"
    dominant-baseline="central"
  >
    17
  </text>
  <circle
    cx={pos17.x}
    cy={pos17.y}
    r={LETTER_CIRCLE_R}
    fill="none"
    stroke={COL_LINE}
    stroke-width={STROKE_WIDTH}
  />
  <text
    x={pos17.x}
    y={pos17.y}
    font-size={LETTER_FONT_SIZE}
    fill={COL_TEXT}
    text-anchor="middle"
    dominant-baseline="central"
  >
    B
  </text>
  {@render extraContent?.()}
{/snippet}

<Step5 extraDefs={defs} extraContent={content} />
