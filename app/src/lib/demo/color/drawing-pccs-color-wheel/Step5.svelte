<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    LETTER_CIRCLE_R,
    LETTER_FONT_SIZE,
    STROKE_WIDTH,
    letterPosition
  } from "./constants"
  import Step4 from "./Step4.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
    extraUnderlay?: Snippet
  }

  let { extraDefs, extraContent, extraUnderlay }: Props = $props()

  const circledLetters = [
    { hue: 2, letter: "R" },
    { hue: 8, letter: "Y" },
    { hue: 12, letter: "G" },
    { hue: 18, letter: "B" }
  ]
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  {#each circledLetters as item (item.hue)}
    {@const p = letterPosition(item.hue)}
    <circle
      cx={p.x}
      cy={p.y}
      r={LETTER_CIRCLE_R}
      fill="none"
      stroke={COL_LINE}
      stroke-width={STROKE_WIDTH}
    />
    <text
      x={p.x}
      y={p.y}
      font-size={LETTER_FONT_SIZE}
      fill={COL_TEXT}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {item.letter}
    </text>
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step4 extraDefs={defs} extraContent={content} {extraUnderlay} />
