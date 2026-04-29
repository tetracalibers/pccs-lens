<script lang="ts">
  import type { Snippet } from "svelte"
  import { LETTER_FONT_SIZE, COL_TEXT, letterPosition } from "./constants"
  import Step8 from "./Step8.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
    extraUnderlay?: Snippet
  }

  let { extraDefs, extraContent, extraUnderlay }: Props = $props()

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

<Step8 extraDefs={defs} extraContent={content} {extraUnderlay} />
