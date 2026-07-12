<script lang="ts">
  import { toneNameJa } from "$lib/games/tone-match/round"

  interface Props {
    /** 現在のお題トーン（強調するセル）。 */
    selected: string
    /** トーンをクリックしたときのハンドラ。 */
    onselect: (tone: string) => void
  }

  let { selected, onselect }: Props = $props()

  // --- トーンマップの寸法（間隔はここの定数で管理する）---
  const CELL_R = 18 // セル半径
  const PAD = 4 // 外周の余白
  const COL_STEP = 50 // 列の中心間隔（横のセル間隔）。大きくすると横余白が増える
  const ROW_STEP = 44 // 行の中心間隔（縦のセル間隔）。大きくすると縦余白が増える

  // 有彩色トーンの配置（無彩色列を除いた 4 列。s は選べないダミーセル）。
  // col: 列インデックス（0〜3）、row: 基準からの行ステップ数（0.5 刻みの互い違い配置）。
  type CellDef = { tone: string; col: number; row: number; selectable: boolean }
  const CELL_DEFS: CellDef[] = [
    { tone: "p", col: 0, row: 0.5, selectable: true },
    { tone: "ltg", col: 0, row: 1.5, selectable: true },
    { tone: "g", col: 0, row: 2.5, selectable: true },
    { tone: "dkg", col: 0, row: 3.5, selectable: true },
    { tone: "lt", col: 1, row: 0.5, selectable: true },
    { tone: "sf", col: 1, row: 1.5, selectable: true },
    { tone: "d", col: 1, row: 2.5, selectable: true },
    { tone: "dk", col: 1, row: 3.5, selectable: true },
    { tone: "b", col: 2, row: 1, selectable: true },
    { tone: "s", col: 2, row: 2, selectable: false },
    { tone: "dp", col: 2, row: 3, selectable: true },
    { tone: "v", col: 3, row: 2, selectable: true }
  ]

  // 実際に使う最小・最大の列/行から描画領域を導出する。
  // 行は 0.5 始まりのため、最小行を基準にして上下の余白を PAD に揃える
  // （行 0 を基準にすると最上段の上だけ余白が広くなってしまう）。
  const MIN_COL = Math.min(...CELL_DEFS.map((c) => c.col))
  const MAX_COL = Math.max(...CELL_DEFS.map((c) => c.col))
  const MIN_ROW = Math.min(...CELL_DEFS.map((c) => c.row))
  const MAX_ROW = Math.max(...CELL_DEFS.map((c) => c.row))

  // 定数から各セルの中心座標を導出する。最小列・最小行のセルの外縁が PAD になる。
  const CELLS = CELL_DEFS.map((c) => ({
    ...c,
    cx: PAD + CELL_R + (c.col - MIN_COL) * COL_STEP,
    cy: PAD + CELL_R + (c.row - MIN_ROW) * ROW_STEP
  }))
  const VIEW_W = 2 * (PAD + CELL_R) + (MAX_COL - MIN_COL) * COL_STEP
  const VIEW_H = 2 * (PAD + CELL_R) + (MAX_ROW - MIN_ROW) * ROW_STEP

  const pct = (value: number, total: number): number => (value / total) * 100
  const SIZE_PCT = pct(2 * CELL_R, VIEW_W)
</script>

<div
  class="map"
  role="group"
  aria-label="探すトーンを選ぶトーンマップ"
  style="aspect-ratio: {VIEW_W} / {VIEW_H};"
>
  {#each CELLS as cell (cell.tone)}
    {@const style = `left: ${pct(cell.cx, VIEW_W)}%; top: ${pct(cell.cy, VIEW_H)}%; width: ${SIZE_PCT}%;`}
    {#if cell.selectable}
      <button
        type="button"
        class="cell"
        class:selected={selected === cell.tone}
        {style}
        aria-pressed={selected === cell.tone}
        aria-label="{cell.tone} {toneNameJa(cell.tone)}トーンを探す"
        onclick={() => onselect(cell.tone)}
      >
        {cell.tone}
      </button>
    {:else}
      <!-- s トーンはプール外なので選べない。マップの形を保つためだけに薄く表示する。 -->
      <span class="cell disabled" {style} aria-hidden="true">{cell.tone}</span>
    {/if}
  {/each}
</div>

<style>
  .map {
    position: relative;
    width: 100%;
    max-width: 232px;
    margin: 0 auto;
  }

  .cell {
    position: absolute;
    transform: translate(-50%, -50%);
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: 1.5px solid rgb(from var(--color-body) r g b / 0.4);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-body);
    cursor: pointer;
    transition:
      transform 0.15s,
      border-color 0.2s,
      color 0.2s,
      box-shadow 0.2s;
  }

  .cell:hover {
    transform: translate(-50%, -50%) scale(1.08);
    border-color: var(--color-heading);
    color: var(--color-heading);
  }

  .cell:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 2px;
  }

  .cell.selected {
    border-color: var(--color-heading);
    color: var(--color-heading);
    font-weight: 900;
    box-shadow:
      0 0 0 3px var(--color-surface, light-dark(#ffffff, #16161f)),
      0 0 0 5px var(--color-heading);
  }

  .cell.disabled {
    cursor: default;
    border-style: dashed;
    border-color: rgb(from var(--color-body) r g b / 0.2);
    color: rgb(from var(--color-body) r g b / 0.35);
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    .cell {
      transition: none;
    }
    .cell:hover {
      transform: translate(-50%, -50%);
    }
  }
</style>
