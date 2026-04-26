<script lang="ts">
  import type { Snippet } from "svelte"
  import {
    COL_LINE,
    COL_TEXT,
    LETTER_FONT_SIZE,
    STROKE_WIDTH,
    hueAngle,
    letterPosition,
    tickEndpoints
  } from "./constants"
  import Step8 from "./Step8.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // 円弧に含まれない目盛りのうち, まだ目盛り自体が無いもの
  const newOddTicks = [15]

  // 丸囲みなしのラベル. 24 (RP) はソース文に明記されていないが
  // 円弧に含まれず, 同じ規則 (両隣のアルファベットを反時計回り順) で埋まる位置.
  const plainLabels = [
    { hue: 20, label: "V" },
    { hue: 10, label: "YR" },
    { hue: 14, label: "BG" },
    { hue: 15, label: "BG" },
    { hue: 24, label: "RP" }
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
  {#each plainLabels as item (item.hue)}
    {@const p = letterPosition(item.hue)}
    <text
      x={p.x}
      y={p.y}
      font-size={LETTER_FONT_SIZE}
      fill={COL_TEXT}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {item.label}
    </text>
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step8 extraDefs={defs} extraContent={content} />
