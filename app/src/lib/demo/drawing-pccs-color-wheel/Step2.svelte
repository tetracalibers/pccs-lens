<script lang="ts">
  import type { Snippet } from "svelte"
  import { COL_LINE, STROKE_WIDTH, tickEndpoints } from "./constants"
  import Step1 from "./Step1.svelte"

  interface Props {
    extraDefs?: Snippet
    extraContent?: Snippet
    extraUnderlay?: Snippet
  }

  let { extraDefs, extraContent, extraUnderlay }: Props = $props()

  // 主目盛りの間に2つずつ追加 (30° 間隔, 計8本)
  const minorTickAngles = [30, 60, 120, 150, 210, 240, 300, 330]
</script>

{#snippet defs()}
  {@render extraDefs?.()}
{/snippet}

{#snippet content()}
  {#each minorTickAngles as ang (ang)}
    {@const e = tickEndpoints(ang)}
    <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={COL_LINE} stroke-width={STROKE_WIDTH} />
  {/each}
  {@render extraContent?.()}
{/snippet}

<Step1 extraDefs={defs} extraContent={content} {extraUnderlay} />
