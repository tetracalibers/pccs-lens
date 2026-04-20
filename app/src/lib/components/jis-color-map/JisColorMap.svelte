<script lang="ts">
  import { buildJisColorMap } from "$lib/jis-color-map/build-map"
  import { buildMapLayout } from "$lib/jis-color-map/layout"
  import type { JISColorGroupId } from "$lib/data/jis-colors"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import ValueSwatch from "./ValueSwatch.svelte"
  import JisColorSwatch from "./JisColorSwatch.svelte"
  import PccsSwatch from "./PccsSwatch.svelte"

  let { groupId }: { groupId: JISColorGroupId } = $props()

  const data = $derived(buildJisColorMap(groupId))
  const layout = $derived(buildMapLayout(data))
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
        <ValueSwatch value={vs.value} scale={vs.rowSpan} />
      </div>
    {/each}

    <!-- 等明度軸 -->
    {#each layout.equiAxis as ea (`${ea.col}:${ea.row}`)}
      <div class="grid-item" style:grid-column={ea.col} style:grid-row={ea.row + 1}>
        <ValueSwatch value={ea.value} />
      </div>
    {/each}

    <!-- セル -->
    {#each layout.placements as p (`${p.col}:${p.row}`)}
      <div
        class="grid-item"
        style:grid-column={p.col}
        style:grid-row="{p.row + 1} / span {p.rowSpan}"
      >
        {#if p.cell.kind === "jis"}
          {@const pccs = p.cell.pccsHint
            ? {
                symbol:
                  PCCS_HUE_MAP.get(p.cell.pccsHint.hueNumber!)?.symbol ?? p.cell.pccsHint.notation,
                hex: p.cell.pccsHint.hex
              }
            : undefined}
          <JisColorSwatch colors={p.cell.colors} {pccs} />
        {:else}
          <PccsSwatch pccs={p.cell.pccs} />
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .scroll {
    overflow-x: auto;
    padding-block: 0.5rem 1.5rem;
    padding-inline: 0;
    max-width: 90cqw;

    --cell-size: 60px;
    --map-font-xs: calc(var(--cell-size) * 0.12);
    --map-font-s: calc(var(--cell-size) * 0.14);
    --map-font-m: calc(var(--cell-size) * 0.16);
    --map-font-l: calc(var(--cell-size) * 0.19);
  }

  @media (max-width: 640px) {
    .scroll {
      --cell-size: 56px;
    }
  }

  .map {
    display: grid;
    gap: 4px;
    width: max-content;
    margin-inline: auto;
    padding-inline-end: 1rem;
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
    font-size: var(--map-font-m);
    font-family: var(--font-mono);
    color: var(--color-body);
    padding: 0.25rem 0;
    white-space: nowrap;
  }

  .grid-item {
    min-width: 0;
    min-height: 0;
  }
</style>
