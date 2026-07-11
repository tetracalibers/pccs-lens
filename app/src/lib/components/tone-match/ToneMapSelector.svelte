<script lang="ts">
  import { toneNameJa } from "$lib/games/tone-match/round"

  interface Props {
    /** 現在のお題トーン（強調するセル）。 */
    selected: string
    /** トーンをクリックしたときのハンドラ。 */
    onselect: (tone: string) => void
  }

  let { selected, onselect }: Props = $props()

  // 有彩色トーンマップの座標（無彩色列を除いた 4 列。s は選べないダミーセル）。
  const VIEW_W = 206
  const VIEW_H = 204
  const R = 21

  type Cell = { tone: string; cx: number; cy: number; selectable: boolean }
  const CELLS: Cell[] = [
    { tone: "p", cx: 25, cy: 47, selectable: true },
    { tone: "ltg", cx: 25, cy: 91, selectable: true },
    { tone: "g", cx: 25, cy: 135, selectable: true },
    { tone: "dkg", cx: 25, cy: 179, selectable: true },
    { tone: "lt", cx: 77, cy: 47, selectable: true },
    { tone: "sf", cx: 77, cy: 91, selectable: true },
    { tone: "d", cx: 77, cy: 135, selectable: true },
    { tone: "dk", cx: 77, cy: 179, selectable: true },
    { tone: "b", cx: 129, cy: 69, selectable: true },
    { tone: "s", cx: 129, cy: 113, selectable: false },
    { tone: "dp", cx: 129, cy: 157, selectable: true },
    { tone: "v", cx: 181, cy: 113, selectable: true }
  ]

  const pct = (value: number, total: number): number => (value / total) * 100
  const SIZE_PCT = pct(2 * R, VIEW_W)
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
