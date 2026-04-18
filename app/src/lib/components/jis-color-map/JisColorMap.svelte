<script lang="ts">
  import { SvelteMap, SvelteSet } from "svelte/reactivity"
  import { buildJisColorMap } from "$lib/jis-color-map/build-map"
  import type { JISColorGroupId } from "$lib/data/jis-colors"
  import type { MapCell } from "$lib/jis-color-map/types"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import ValueSwatch from "./ValueSwatch.svelte"
  import JisColorSwatch from "./JisColorSwatch.svelte"
  import PccsSwatch from "./PccsSwatch.svelte"

  let { groupId }: { groupId: JISColorGroupId } = $props()

  const data = $derived(buildJisColorMap(groupId))

  type Placement = {
    cell: MapCell
    col: number
    row: number
    rowSpan: number
  }

  const layout = $derived.by(() => {
    const { valueRows, hueColumns, cells } = data

    const valueMeta = new SvelteMap<number, { startRow: number; rowSpan: number }>()
    let rowCursor = 1
    for (const vr of valueRows) {
      const span = Math.max(1, vr.chromas.length)
      valueMeta.set(vr.value, { startRow: rowCursor, rowSpan: span })
      rowCursor += span
    }
    const totalRows = rowCursor - 1

    const chromasByValue = new SvelteMap(valueRows.map((vr) => [vr.value, vr.chromas]))
    const hueIndex = new SvelteMap(hueColumns.map((h, i) => [h.rank, i]))

    const placements: Placement[] = []
    const occupied = new SvelteSet<string>()
    const occupyKey = (col: number, row: number) => `${col}:${row}`

    const markOccupied = (col: number, row: number, rowSpan: number) => {
      for (let r = 0; r < rowSpan; r++) occupied.add(occupyKey(col, row + r))
    }

    for (const cell of cells) {
      const meta = valueMeta.get(cell.value)
      if (!meta) continue

      if (cell.kind === "jis" && cell.hueRank === null) {
        // 無彩色: 明度スケール列全体を占有
        placements.push({ cell, col: 1, row: meta.startRow, rowSpan: meta.rowSpan })
        markOccupied(1, meta.startRow, meta.rowSpan)
        continue
      }

      const chroma = cell.kind === "jis" ? cell.chroma : cell.chroma
      const hueRank = cell.kind === "jis" ? cell.hueRank : cell.hueRank
      if (chroma === null || hueRank === null) continue
      const chromas = chromasByValue.get(cell.value) ?? []
      const subIndex = chromas.indexOf(chroma)
      const hIdx = hueIndex.get(hueRank)
      if (subIndex < 0 || hIdx === undefined) continue
      const col = 2 + hIdx
      const row = meta.startRow + subIndex
      placements.push({ cell, col, row, rowSpan: 1 })
      markOccupied(col, row, 1)
    }

    // 明度スケール列のValueSwatch（無彩色で置き換えられていない明度）
    const valueScale: { value: number; row: number; rowSpan: number }[] = []
    for (const vr of valueRows) {
      const meta = valueMeta.get(vr.value)!
      if (!occupied.has(occupyKey(1, meta.startRow))) {
        valueScale.push({ value: vr.value, row: meta.startRow, rowSpan: meta.rowSpan })
        markOccupied(1, meta.startRow, meta.rowSpan)
      }
    }

    // 等明度軸: value=5.0の行で空いたセルにValueSwatchを置く
    // ただし明度5.0の慣用色が複数ある場合、軸線が分断されるため描画しない
    const equiAxis: { value: number; col: number; row: number }[] = []
    const equiMeta = valueMeta.get(5.0)
    const jisCountAtEqui = cells.filter((c) => c.kind === "jis" && c.value === 5.0).length
    if (equiMeta && jisCountAtEqui < 2) {
      for (let r = 0; r < equiMeta.rowSpan; r++) {
        const row = equiMeta.startRow + r
        for (let i = 0; i < hueColumns.length; i++) {
          const col = 2 + i
          if (!occupied.has(occupyKey(col, row))) {
            equiAxis.push({ value: 5.0, col, row })
          }
        }
      }
    }

    return { placements, valueScale, equiAxis, totalRows, totalCols: 1 + hueColumns.length }
  })
</script>

<div class="scroll">
  <div
    class="map"
    style:grid-template-columns="auto repeat({data.hueColumns.length}, var(--cell-size))"
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
          {@const pccsSymbol = p.cell.pccsHint
            ? (PCCS_HUE_MAP.get(p.cell.pccsHint.hueNumber!)?.symbol ?? p.cell.pccsHint.notation)
            : undefined}
          <JisColorSwatch colors={p.cell.colors} {pccsSymbol} />
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
    padding: 0.5rem 0.25rem 1.5rem;

    --cell-size: 72px;
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
    padding: 0.5rem;
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
    font-size: 0.65rem;
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
