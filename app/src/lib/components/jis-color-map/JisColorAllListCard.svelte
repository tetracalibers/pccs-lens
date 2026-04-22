<script lang="ts">
  import { resolve } from "$app/paths"

  interface Props {
    checkerColors: [string, string, string, string, string, string, string]
  }

  let { checkerColors }: Props = $props()
</script>

<a href={resolve("/jis-color-map/all")} class="card">
  <div class="card-checker">
    {#each checkerColors as color, i (i)}
      <span class="checker-cell" style:background-color={color}></span>
    {/each}
  </div>
  <div class="card-body">
    <div class="card-title">
      <span class="label-ja">慣用色名 全一覧</span>
    </div>
    <p class="card-desc">由来やPCCS近似値など、色の詳細を学ぼう</p>
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: row;
    text-decoration: none;
    color: inherit;
    border: 1px solid light-dark(#e0e0e0, #2e2e3e);
    border-radius: 6px;
    overflow: hidden;
    transition:
      box-shadow 0.15s,
      transform 0.15s;
    min-height: 88px;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-checker {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    flex-shrink: 0;
    aspect-ratio: 1;
    min-width: 88px;
  }

  .checker-cell {
    display: block;
  }

  .card-body {
    padding: 0.75rem 0.85rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    justify-content: center;
  }

  .card-title {
    display: flex;
    align-items: baseline;
    column-gap: 0.6rem;
    row-gap: 0.1rem;
    flex-wrap: wrap;
  }

  .label-ja {
    font-size: 1rem;
    font-weight: 700;
  }

  .card-desc {
    font-size: 0.78rem;
    color: var(--color-body);
    margin: 0;
    line-height: 1.5;
  }
</style>
