<script lang="ts">
  import type { Snippet } from "svelte"
  import { COL_TEXT, NUM_FONT_SIZE, numberPosition } from "./constants"
  import Step3 from "./Step3.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // `2` は Step3 で描画済み. `4`〜`24` を 9時 (180°) から時計回りに 30° 刻みで配置.
  const remainingNumbers = Array.from({ length: 11 }, (_, i) => {
    const k = i + 1
    return {
      num: 2 + k * 2,
      angle: (180 + k * 30) % 360
    }
  })
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  {#each remainingNumbers as item (item.num)}
    {@const p = numberPosition(item.angle)}
    <text
      x={p.x}
      y={p.y}
      font-size={NUM_FONT_SIZE}
      fill={COL_TEXT}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {item.num}
    </text>
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step3 extraDefs={defs} extraContent={content} />
