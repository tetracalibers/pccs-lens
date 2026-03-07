<script lang="ts">
  import { base } from "$app/paths"
</script>

<svelte:head>
  <title>PCCS Lens</title>
</svelte:head>

<main>
  <h1>PCCS Lens</h1>
  <p>色をPCCSというレンズを通して見る</p>
  <nav class="feature-nav">
    <a href="{base}/approximate" class="feature-card">
      <span class="feature-title">色のPCCS近似</span>
      <span class="feature-desc">入力した色に最も近いPCCS値を表示する</span>
    </a>
    <a href="{base}/analyze" class="feature-card">
      <span class="feature-title">配色の分析と調整</span>
      <span class="feature-desc">複数の色をPCCSで分析・インタラクティブに調整する</span>
    </a>
  </nav>
</main>

<style>
  main {
    max-width: 600px;
    margin: 3rem auto;
    padding: 0 1rem;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  p {
    color: var(--color-text-secondary, #555);
    margin: 0 0 2rem;
  }

  .feature-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
  }

  .feature-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem 1.25rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s;
  }

  .feature-card:hover {
    border-color: var(--color-primary, #1a1a1a);
  }

  .feature-title {
    font-weight: 600;
    font-size: 1rem;
  }

  .feature-desc {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #555);
  }
</style>
