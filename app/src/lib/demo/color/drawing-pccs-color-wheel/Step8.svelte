<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    LETTER_CIRCLE_R,
    LETTER_FONT_SIZE,
    NUM_FONT_SIZE,
    STROKE_WIDTH,
    arcColor,
    arcPath,
    fillBandPath,
    fillColor,
    hueAngle,
    letterPosition,
    numberPosition,
    tickEndpoints
  } from "./constants"
  import Step7 from "./Step7.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
    extraUnderlay?: Snippet
  }

  let { extraDefs, extraContent, extraUnderlay }: Props = $props()

  // O/P 系の追加に伴う奇数目盛り (5: O 自身, 21/23: P 系両端) と, 円弧に含まれない 15
  const newOddTicks = [5, 15, 21, 23]

  // 奇数番号 (5) は丸で囲まない. 偶数番号 (22) のみ丸で囲む.
  const plainLetters = [{ hue: 5, letter: "O" }]
  const circledLetters = [{ hue: 22, letter: "P" }]

  // 円弧の色は中心となる丸囲み色相 (奇数の O も含む) の色.
  const arcs = [
    { from: 4, to: 6, centerHue: 5 },
    { from: 21, to: 23, centerHue: 22 }
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

<Step7 extraDefs={defs} extraContent={content} extraUnderlay={underlay} />
