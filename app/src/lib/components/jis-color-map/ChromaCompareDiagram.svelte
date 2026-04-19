<script lang="ts">
  import type { ChromaCompareDiagramData } from "$lib/jis-color-map/compare"

  let {
    data,
    familyHex
  }: {
    data: ChromaCompareDiagramData
    familyHex: string
  } = $props()

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
    <svg
      class="arrow"
      viewBox="0 0 20 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chroma-grad-{i}-{seg.dir}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={seg.topHex} />
          <stop offset="100%" stop-color={seg.bottomHex} />
        </linearGradient>
      </defs>
      {#if seg.dir === "up"}
        <polygon points="10,2 5,10 15,10" fill={seg.topHex} />
        <rect x="8" y="10" width="4" height="88" fill="url(#chroma-grad-{i}-up)" />
      {:else}
        <rect x="8" y="2" width="4" height="88" fill="url(#chroma-grad-{i}-down)" />
        <polygon points="10,98 5,90 15,90" fill={seg.bottomHex} />
      {/if}
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
    gap: 0.25rem;
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
  }
</style>
