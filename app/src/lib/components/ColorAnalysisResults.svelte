<script lang="ts">
  import { analyzeColors } from "$lib/color/analyze"
  import type { PCCSColor } from "$lib/data/types"

  let { displayedPCCSList }: { displayedPCCSList: PCCSColor[] } = $props()

  const cards = $derived(analyzeColors(displayedPCCSList))

  const CATEGORY_COLORS: Record<string, string> = {
    色相の関係: "var(--tag-hue, #e07a2f)",
    トーンの関係: "var(--tag-tone, #5b8dd9)",
    色相の自然連鎖: "var(--tag-harmony, #6aaa5a)",
    配色技法: "var(--tag-tech, #a060c0)",
    色相環の分割: "var(--tag-div, #c04060)"
  }
</script>

<section class="analysis-section">
  <h2>配色の特徴</h2>
  {#if cards.length === 0}
    <p class="empty">該当なし</p>
  {:else}
    <ul class="card-grid">
      {#each cards as card (card.id)}
        <li class="analysis-card">
          <span
            class="category-tag"
            style="background: {CATEGORY_COLORS[card.category] ?? '#888'};"
          >{card.category}</span>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .analysis-section {
    margin-top: 2rem;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    color: var(--color-text-secondary, #555);
  }

  .empty {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #888);
    margin: 0;
  }

  .card-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .analysis-card {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    background: var(--color-surface, #fff);
  }

  .category-tag {
    display: inline-block;
    align-self: flex-start;
    padding: 0.1rem 0.5rem;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.02em;
  }

  h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text, #111);
  }

  p {
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0;
    color: var(--color-text-secondary, #555);
  }
</style>
