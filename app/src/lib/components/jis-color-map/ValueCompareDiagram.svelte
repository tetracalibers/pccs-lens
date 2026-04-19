<script lang="ts">
  import type { ValueCompareDiagramData } from "$lib/jis-color-map/compare"

  let { data }: { data: ValueCompareDiagramData } = $props()

  const LOW_HEX = "#333333"
  const HIGH_HEX = "#e8e8e8"

  // 矢印は常に「高明度方向」に向く。2セグメントの場合、各セグメントの向きは
  // 両端の label に基づいて決定する。
  const segments = $derived.by(() => {
    if (data.middleLabel === null) {
      // 2ラベル: top=高, bottom=低, 矢印は上向き
      return [{ dir: "up" as const, topHex: HIGH_HEX, bottomHex: LOW_HEX }]
    }
    // 3ラベル構成
    // topLabel / middleLabel / bottomLabel に基づいて各セグメントのグラデーション方向を決める
    const valueOf = (l: "高明度" | "低明度") => (l === "高明度" ? HIGH_HEX : LOW_HEX)
    return [
      // 上セグメント: top と middle の間
      {
        dir: (data.middleLabel === "低明度" ? "up" : "down") as "up" | "down",
        topHex: valueOf(data.topLabel),
        bottomHex: valueOf(data.middleLabel)
      },
      // 下セグメント: middle と bottom の間
      {
        dir: (data.bottomLabel === "低明度" ? "up" : "down") as "up" | "down",
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
          id="value-grad-{i}"
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
          id="value-marker-{i}"
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
        stroke="url(#value-grad-{i})"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
        marker-start={seg.dir === "up" ? `url(#value-marker-${i})` : null}
        marker-end={seg.dir === "down" ? `url(#value-marker-${i})` : null}
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
