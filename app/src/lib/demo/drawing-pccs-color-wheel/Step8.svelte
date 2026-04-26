<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    LETTER_CIRCLE_R,
    LETTER_FONT_SIZE,
    STROKE_WIDTH,
    arcPath,
    hueAngle,
    letterPosition,
    tickEndpoints
  } from "./constants"
  import Step7 from "./Step7.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // O/P 系の追加に伴う奇数目盛り (5: O 自身, 21/23: P 系両端)
  const newOddTicks = [5, 21, 23]

  // 奇数番号 (5) は丸で囲まない. 偶数番号 (22) のみ丸で囲む.
  const plainLetters = [{ hue: 5, letter: "O" }]
  const circledLetters = [{ hue: 22, letter: "P" }]

  const arcs = [
    { from: 4, to: 6 },
    { from: 21, to: 23 }
  ]
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  {#each newOddTicks as hue (hue)}
    {@const e = tickEndpoints(hueAngle(hue))}
    <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={COL_LINE} stroke-width={STROKE_WIDTH} />
  {/each}
  {#each plainLetters as item (item.hue)}
    {@const p = letterPosition(item.hue)}
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
  {#each arcs as arc (arc.from)}
    <path d={arcPath(arc.from, arc.to)} fill="none" stroke={COL_LINE} stroke-width={STROKE_WIDTH} />
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step7 extraDefs={defs} extraContent={content} />
