<script lang="ts">
  import type { Snippet } from "svelte"
  import { COL_TEXT, LETTER_FONT_SIZE, letterPosition } from "./constants"
  import Step9 from "./Step9.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // 残りの目盛り. ラベル = 最寄りの「丸囲みアルファベット (同じ円弧の文字を除く)」
  // の小文字 + 円弧の文字の大文字.
  const plainLabels = [
    { hue: 1, label: "pR" },
    { hue: 3, label: "yR" },
    { hue: 4, label: "rO" },
    { hue: 6, label: "yO" },
    { hue: 7, label: "rY" },
    { hue: 9, label: "gY" },
    { hue: 11, label: "yG" },
    { hue: 13, label: "bG" },
    { hue: 16, label: "gB" },
    { hue: 19, label: "pB" },
    { hue: 21, label: "bP" },
    { hue: 23, label: "rP" }
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

<Step9 extraDefs={defs} extraContent={content} />
