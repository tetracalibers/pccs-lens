<script lang="ts">
  import { PRIMARY_HUE_LABEL_SLUG, type MunsellPrimaryHueLabel } from "$lib/color/munsell"
  import type { HueCompareDiagramData } from "$lib/jis-color-map/compare"

  let { data }: { data: HueCompareDiagramData } = $props()

  const LABEL_HEX: Record<MunsellPrimaryHueLabel, string> = {
    赤: "#e60033",
    黄: "#ffd400",
    緑: "#00a040",
    青: "#0068b7",
    紫: "#7e3f8f"
  }

  const topSlug = $derived(PRIMARY_HUE_LABEL_SLUG[data.topLabel])
  const bottomSlug = $derived(PRIMARY_HUE_LABEL_SLUG[data.bottomLabel])
  const gradId = $derived(`hue-grad-${topSlug}-${bottomSlug}`)
  const markerTopId = $derived(`hue-marker-top-${topSlug}-${bottomSlug}`)
  const markerBottomId = $derived(`hue-marker-bottom-${topSlug}-${bottomSlug}`)
  const topHex = $derived(LABEL_HEX[data.topLabel])
  const bottomHex = $derived(LABEL_HEX[data.bottomLabel])
</script>

<div class="diagram">
  <div class="label">{data.topLabel}</div>
  <svg
    class="arrow"
    viewBox="0 0 20 100"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="10" y2="94">
        <stop offset="0%" stop-color={topHex} />
        <stop offset="100%" stop-color={bottomHex} />
      </linearGradient>
      <marker
        id={markerTopId}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="9"
        markerHeight="12"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <path
          d="M 1 1 L 4.5 4.5 A 0.7 0.7 0 0 1 4.5 5.5 L 1 9"
          fill="none"
          stroke={topHex}
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </marker>
      <marker
        id={markerBottomId}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="9"
        markerHeight="12"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <path
          d="M 1 1 L 4.5 4.5 A 0.7 0.7 0 0 1 4.5 5.5 L 1 9"
          fill="none"
          stroke={bottomHex}
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </marker>
    </defs>
    <line
      x1="10"
      y1="6"
      x2="10"
      y2="94"
      stroke="url(#{gradId})"
      stroke-width="2"
      marker-start="url(#{markerTopId})"
      marker-end="url(#{markerBottomId})"
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <div class="label">{data.bottomLabel}</div>
</div>

<style>
  .diagram {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    min-height: 6rem;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.75rem;
    color: var(--color-body);
  }

  .arrow {
    flex: 1;
    width: 1.5rem;
    min-height: 0;
  }
</style>
