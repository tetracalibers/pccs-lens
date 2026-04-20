<script lang="ts">
  import type { MunsellPrimaryHueLabel } from "$lib/color/munsell"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import type { HueCompareDiagramData } from "$lib/jis-color-map/compare"

  let { data }: { data: HueCompareDiagramData } = $props()

  const LABEL_HEX: Record<MunsellPrimaryHueLabel, string> = {
    赤: PCCS_HEX_MAP.get("v2")!,
    黄: PCCS_HEX_MAP.get("v8")!,
    緑: PCCS_HEX_MAP.get("v12")!,
    青: PCCS_HEX_MAP.get("v18")!,
    紫: PCCS_HEX_MAP.get("v22")!
  }

  const uid = $props.id()
  const gradId = `hue-grad-${uid}`
  const markerTopId = `hue-marker-top-${uid}`
  const markerBottomId = `hue-marker-bottom-${uid}`
  const topHex = $derived(LABEL_HEX[data.topLabel])
  const bottomHex = $derived(LABEL_HEX[data.bottomLabel])
</script>

<div class="diagram">
  <div class="label" style="--_label-color: {topHex}">{data.topLabel}</div>
  <svg class="arrow" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stop-color={topHex} />
        <stop offset="100%" stop-color={bottomHex} />
      </linearGradient>
      <marker
        id={markerTopId}
        viewBox="0 0 7 7"
        refX="3.5"
        refY="3.5"
        markerWidth="14"
        markerHeight="14"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <polyline
          points="0,3.5 3.5,1.75 0,0"
          fill="none"
          stroke={topHex}
          stroke-width="1.1667"
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="translate(1.1667 1.75)"
        />
      </marker>
      <marker
        id={markerBottomId}
        viewBox="0 0 7 7"
        refX="3.5"
        refY="3.5"
        markerWidth="14"
        markerHeight="14"
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <polyline
          points="0,3.5 3.5,1.75 0,0"
          fill="none"
          stroke={bottomHex}
          stroke-width="1.1667"
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="translate(1.1667 1.75)"
        />
      </marker>
    </defs>
    <line
      x1="50%"
      y1="0"
      x2="50%"
      y2="100%"
      stroke="url(#{gradId})"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      marker-start="url(#{markerTopId})"
      marker-end="url(#{markerBottomId})"
    />
  </svg>
  <div class="label" style="--_label-color: {bottomHex}">{data.bottomLabel}</div>
</div>

<style>
  .diagram {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    min-height: 6rem;
    gap: 0.5rem;
  }

  .label {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--_label-color);
  }

  .arrow {
    flex: 1;
    width: 1.5rem;
    min-height: 0;
    overflow: visible;
  }
</style>
