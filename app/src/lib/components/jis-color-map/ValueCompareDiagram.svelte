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
    <svg
      class="arrow"
      viewBox="0 0 20 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="value-grad-{i}-{seg.dir}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={seg.topHex} />
          <stop offset="100%" stop-color={seg.bottomHex} />
        </linearGradient>
      </defs>
      {#if seg.dir === "up"}
        <polygon points="10,2 5,10 15,10" fill={seg.topHex} />
        <rect x="8" y="10" width="4" height="88" fill="url(#value-grad-{i}-up)" />
      {:else}
        <rect x="8" y="2" width="4" height="88" fill="url(#value-grad-{i}-down)" />
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
