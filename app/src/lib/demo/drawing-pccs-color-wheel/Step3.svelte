<script lang="ts">
  import type { Snippet } from "svelte"
  import { COL_TEXT, NUM_FONT_SIZE, numberPosition } from "./constants"
  import Step2 from "./Step2.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
  }

  let { extraDefs, extraContent }: Props = $props()

  // 9時 = 180°
  const pos = numberPosition(180)
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  <text
    x={pos.x}
    y={pos.y}
    font-size={NUM_FONT_SIZE}
    fill={COL_TEXT}
    text-anchor="middle"
    dominant-baseline="central"
  >
    2
  </text>
  {@render extraContent?.()}
{/snippet}

<Step2 extraDefs={defs} extraContent={content} />
