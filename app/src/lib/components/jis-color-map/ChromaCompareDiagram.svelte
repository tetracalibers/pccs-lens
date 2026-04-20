<script lang="ts">
  import type { ChromaCompareDiagramData } from "$lib/jis-color-map/compare"

  let {
    data,
    familyHex
  }: {
    data: ChromaCompareDiagramData
    familyHex: string
  } = $props()

  const uid = $props.id()

  const LOW_HEX = "#b8b8b8"

  const segments = $derived.by(() => {
    if (data.middleLabel === null) {
      return [{ dir: "up" as const, topHex: familyHex, bottomHex: LOW_HEX }]
    }
    const valueOf = (l: "高彩度" | "低彩度") => (l === "高彩度" ? familyHex : LOW_HEX)
    return [
      {
        dir: (data.middleLabel === "低彩度" ? "up" : "down") as "up" | "down",
        topHex: valueOf(data.topLabel),
        bottomHex: valueOf(data.middleLabel)
      },
      {
        dir: (data.bottomLabel === "低彩度" ? "up" : "down") as "up" | "down",
        topHex: valueOf(data.middleLabel),
        bottomHex: valueOf(data.bottomLabel)
      }
    ]
  })
</script>

<div class="diagram">
  <div class="label">{data.topLabel}</div>
  {#each segments as seg, i (i)}
    <svg class="arrow" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="chroma-grad-{uid}-{i}"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
        >
          <stop offset="0%" stop-color={seg.topHex} />
          <stop offset="100%" stop-color={seg.bottomHex} />
        </linearGradient>
        <marker
          id="chroma-marker-{uid}-{i}"
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
            stroke={seg.dir === "up" ? seg.topHex : seg.bottomHex}
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
        stroke="url(#chroma-grad-{uid}-{i})"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        marker-start={seg.dir === "up" ? `url(#chroma-marker-${uid}-${i})` : null}
        marker-end={seg.dir === "down" ? `url(#chroma-marker-${uid}-${i})` : null}
      />
    </svg>
    {#if i === 0 && data.middleLabel}
      <div class="label">{data.middleLabel}</div>
    {/if}
  {/each}
  <div class="label">{data.bottomLabel}</div>
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
    color: var(--color-body);
    white-space: nowrap;
  }

  .arrow {
    flex: 1;
    width: 1.5rem;
    min-height: 0;
    overflow: visible;
  }
</style>
