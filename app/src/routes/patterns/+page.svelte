<script lang="ts">
  import { resolve } from "$app/paths"
  import { THEMES } from "$lib/patterns/themes"
  import { computeSuggest } from "$lib/patterns/suggest"
  import { pickRandomSuggest, lookupPCCSColor } from "$lib/patterns/lookup"

  // 各テーマのベースカラー初期サジェストから代表色を1色取得する（カードのアクセント用）
  function getRepresentativeHex(themeId: string): string {
    const theme = THEMES.find((t) => t.id === themeId)
    if (!theme) return "#cccccc"
    const suggest = computeSuggest({ theme: theme.id, role: "base" })
    const picked = pickRandomSuggest(suggest)
    if (!picked) return "#cccccc"
    const color = lookupPCCSColor(picked.hueNumber, picked.toneSymbol)
    return color?.hex ?? "#cccccc"
  }

  // SSR非対応（CSR完結）なので onMount 等は不要。$derived でリアクティブに取得。
  const themeColors = THEMES.map((t) => ({
    theme: t,
    hex: getRepresentativeHex(t.id)
  }))
</script>

<svelte:head>
  <title>配色シミュレータ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <h1>配色シミュレータ</h1>
    <p class="subtitle">
      イメージ（テーマ）を選んで、配色ルールに沿った色の組み合わせを試してみましょう。
    </p>
  </div>

  <div class="grid">
    {#each themeColors as { theme, hex } (theme.id)}
      <a href={resolve(`/patterns/${theme.id}`)} class="card">
        <div class="card-accent" style="background-color: {hex};"></div>
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
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 10px;
    overflow: hidden;
    transition:
      box-shadow 0.15s,
      transform 0.15s;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-accent {
    height: 6px;
    flex-shrink: 0;
  }

  .card-body {
    padding: 0.85rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .card-title {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
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
    font-size: 0.8rem;
    color: var(--color-text-secondary, #666);
    margin: 0;
    line-height: 1.5;
  }
</style>
