<script lang="ts">
  import { buildJisColorMap } from "$lib/jis-color-map/build-map"
  import { buildMapLayout } from "$lib/jis-color-map/layout"
  import type { ColorSubfamily } from "$lib/data/jis-colors"
  import ValueSwatch from "./ValueSwatch.svelte"
  import PccsSwatch from "./PccsSwatch.svelte"
  import CompactJisColorSwatch from "./CompactJisColorSwatch.svelte"
  import HintJisColorSwatch from "./HintJisColorSwatch.svelte"

  let {
    groupId,
    highlightsJisIds,
    hintJisIds,
    hintPCCSHueNums
  }: {
    groupId: ColorSubfamily
    highlightsJisIds: string[]
    hintJisIds?: string[]
    hintPCCSHueNums?: number[]
  } = $props()

  const data = $derived(buildJisColorMap(groupId))
  const layout = $derived(buildMapLayout(data))

  const highlightSet = $derived(new Set(highlightsJisIds))
  const hintSet = $derived(new Set(hintJisIds ?? []))
  const hintHueSet = $derived(new Set(hintPCCSHueNums ?? []))
</script>

<div class="scroll">
  <div
    class="map"
    style:grid-template-columns="var(--cell-size) repeat({data.hueColumns.length}, var(--cell-size))"
    style:grid-template-rows="auto repeat({layout.totalRows}, var(--cell-size))"
  >
    <!-- 色相ヘッダー -->
    <div class="corner"></div>
    {#each data.hueColumns as col (col.rank)}
      <div class="hue-header" title={col.hue}>{col.hue}</div>
    {/each}

    <!-- 明度スケール -->
    {#each layout.valueScale as vs (vs.row)}
      <div
        class="grid-item"
        style:grid-column="1"
        style:grid-row="{vs.row + 1} / span {vs.rowSpan}"
      >
        <ValueSwatch value={vs.value} scale={vs.rowSpan} compact />
      </div>
    {/each}

    <!-- 等明度軸 -->
    {#each layout.equiAxis as ea (`${ea.col}:${ea.row}`)}
      <div class="grid-item" style:grid-column={ea.col} style:grid-row={ea.row + 1}>
        <ValueSwatch value={ea.value} compact />
      </div>
    {/each}

    <!-- セル -->
    {#each layout.placements as p (`${p.col}:${p.row}`)}
      {#if p.cell.kind === "jis"}
        {@const firstId = p.cell.colors[0].id}
        {@const isHighlight = highlightSet.has(firstId)}
        {@const isHint = hintSet.has(firstId)}
        {@const dim = !isHighlight && !isHint}
        <div
          class="grid-item"
          style:grid-column={p.col}
          style:grid-row="{p.row + 1} / span {p.rowSpan}"
        >
          {#if isHint}
            <HintJisColorSwatch color={p.cell.colors[0]} />
          {:else}
            <CompactJisColorSwatch colors={p.cell.colors} variant={dim ? "outline" : "fill"} />
          {/if}
        </div>
      {:else}
        {@const hueNum = p.cell.pccs.hueNumber}
        {@const dim = hueNum !== null && !hintHueSet.has(hueNum)}
        <div
          class="grid-item"
          style:grid-column={p.col}
          style:grid-row="{p.row + 1} / span {p.rowSpan}"
        >
          <PccsSwatch pccs={p.cell.pccs} compact variant={dim ? "outline" : "fill"} />
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .scroll {
    overflow-x: auto;
    padding-block: 0.5rem 0.5rem;

    --cell-size: 32px;
    --map-font-xs: calc(var(--cell-size) * 0.22);
    --map-font-s: calc(var(--cell-size) * 0.26);
    --map-font-m: calc(var(--cell-size) * 0.3);
    --map-font-l: calc(var(--cell-size) * 0.36);
  }

  @media (max-width: 640px) {
    .scroll {
      --cell-size: 28px;
    }
  }

  .map {
    display: grid;
    gap: 2px;
    width: max-content;
  }

  .corner {
    grid-column: 1;
    grid-row: 1;
  }

  .hue-header {
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--map-font-s);
    font-family: var(--font-mono);
    color: var(--color-body);
    padding: 0.2rem 0;
    white-space: nowrap;
  }

  .grid-item {
    min-width: 0;
    min-height: 0;
  }
</style>
