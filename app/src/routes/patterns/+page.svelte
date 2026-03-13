<script lang="ts">
  import { resolve } from "$app/paths"
  import { THEMES } from "$lib/patterns/themes"
  import { CHECKERBOARD_RULES } from "$lib/patterns/checkerboard-rules"
  import { pickRandomSuggest, lookupPCCSColor } from "$lib/patterns/lookup"

  // 各テーマのベース・アソートカラーを市松模様専用ルールからランダム選択
  function getCheckerboardColors(themeId: string): { base: string; assort: string } {
    const theme = THEMES.find((t) => t.id === themeId)
    if (!theme) return { base: "#cccccc", assort: "#aaaaaa" }

    const rule = CHECKERBOARD_RULES[theme.id]

    const basePicked = pickRandomSuggest(rule.base)
    const baseHex = basePicked
      ? (lookupPCCSColor(basePicked.hueNumber, basePicked.toneSymbol)?.hex ?? "#cccccc")
      : "#cccccc"

    const assortPicked = pickRandomSuggest(rule.assort)
    const assortHex = assortPicked
      ? (lookupPCCSColor(assortPicked.hueNumber, assortPicked.toneSymbol)?.hex ?? "#aaaaaa")
      : "#aaaaaa"

    return { base: baseHex, assort: assortHex }
  }

  const themeCards = THEMES.map((t) => ({
    theme: t,
    colors: getCheckerboardColors(t.id)
  }))
</script>

<svelte:head>
  <title>配色シミュレータ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <h1>配色シミュレータ</h1>
    <p class="subtitle">イメージを選んで、配色ルールに沿った色の組み合わせを試してみよう</p>
  </div>

  <div class="grid">
    {#each themeCards as { theme, colors } (theme.id)}
      <a href={resolve(`/patterns/${theme.id}`)} class="card">
        <div class="card-checker">
          <span class="checker-cell" style="background-color: {colors.base};"></span>
          <span class="checker-cell" style="background-color: {colors.assort};"></span>
          <span class="checker-cell" style="background-color: {colors.assort};"></span>
          <span class="checker-cell" style="background-color: {colors.base};"></span>
        </div>
        <div class="card-body">
          <div class="card-title">
            <span class="label-ja">{theme.labelJa}</span>
            <span class="label-en">{theme.labelEn}</span>
          </div>
          <p class="card-desc">{theme.imageDescription}</p>
        </div>
      </a>
    {/each}
  </div>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
  }

  .header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .subtitle {
    color: var(--color-text-secondary, #666);
    font-size: 0.9rem;
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .card {
    display: flex;
    flex-direction: row;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--color-border, #ddd);
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
    color: var(--color-text-secondary, #777);
    font-family: var(--font-mono);
  }

  .card-desc {
    font-size: 0.78rem;
    color: var(--color-text-secondary, #666);
    margin: 0;
    line-height: 1.5;
  }
</style>
