<script lang="ts">
  import type { MunsellPrimaryHueLabel } from "$lib/color/munsell"
  import type { HueCompareDiagramData } from "$lib/jis-color-map/compare"

  let { data }: { data: HueCompareDiagramData } = $props()

  const LABEL_HEX: Record<MunsellPrimaryHueLabel, string> = {
    赤: "#e60033",
    黄: "#ffd400",
    緑: "#00a040",
    青: "#0068b7",
    紫: "#7e3f8f"
  }

  const gradId = $derived(`hue-grad-${data.topLabel}-${data.bottomLabel}`)
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
      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={topHex} />
        <stop offset="100%" stop-color={bottomHex} />
      </linearGradient>
    </defs>
    <!-- 両方向矢印: 上下に三角、中央に縦線 -->
    <polygon points="10,2 5,10 15,10" fill={topHex} />
    <rect x="8" y="10" width="4" height="80" fill="url(#{gradId})" />
    <polygon points="10,98 5,90 15,90" fill={bottomHex} />
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
    font-family: var(--font-round);
    color: var(--color-body);
  }

  .arrow {
    flex: 1;
    width: 1.5rem;
    min-height: 0;
  }
</style>
