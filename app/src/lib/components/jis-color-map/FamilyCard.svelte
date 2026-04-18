<script lang="ts">
  import { resolve } from "$app/paths"
  import type { JISColorFamily } from "$lib/data/jis-colors"

  let {
    family,
    labelEn,
    description,
    checkerColors
  }: {
    family: JISColorFamily
    labelEn: string
    description: string
    checkerColors: [string, string]
  } = $props()
</script>

<a href={resolve("/jis-color-map/[family]", { family: family.id })} class="card">
  <div class="card-checker">
    <span class="checker-cell" style="background-color: {checkerColors[0]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[1]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[1]};"></span>
    <span class="checker-cell" style="background-color: {checkerColors[0]};"></span>
  </div>
  <div class="card-body">
    <div class="card-title">
      <span class="label-ja">{family.name}</span>
      <span class="label-en">{labelEn}</span>
    </div>
    <p class="card-desc">{description}</p>
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: row;
    text-decoration: none;
    color: inherit;
    border: 1px solid light-dark(#e0e0e0, #2e2e3e);
    border-radius: 10px;
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
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    flex-shrink: 0;
    aspect-ratio: 1;
    min-width: 88px;
    filter: contrast(1.1) saturate(1.1);
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

  .label-en {
    font-size: 0.75rem;
    color: light-dark(#555555, #999999);
    font-family: var(--font-mono);
  }

  .card-desc {
    font-size: 0.78rem;
    color: light-dark(#555555, #999999);
    margin: 0;
    line-height: 1.5;
  }
</style>
