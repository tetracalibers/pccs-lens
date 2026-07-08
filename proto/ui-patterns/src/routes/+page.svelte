<script lang="ts">
  import { resolve } from "$app/paths"
</script>

<svelte:head>
  <title>PCCS Lens - UIプロトタイプ一覧</title>
</svelte:head>

<main>
  <header>
    <h1>PCCS Lens トップページ デザイン案</h1>
    <p>デザイン案を比較・検討してください</p>
  </header>

  <div class="design-list">
    <a href={resolve("/design-d")} class="design-card">
      <div class="preview preview-d">
        <div class="neon-title">
          PCCS
          <br />
          <span>Lens</span>
        </div>
        <div class="neon-dots">
          {#each ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff"] as color (color)}
            <div class="ndot" style="background:{color}; box-shadow: 0 0 8px {color}"></div>
          {/each}
        </div>
      </div>
      <div class="design-info">
        <span class="label">案D</span>
        <h2>ネオン・ダーク</h2>
        <p>ダーク背景にネオングローで彩る、モダンでインパクトのあるデザイン</p>
      </div>
    </a>
  </div>
</main>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    font-family: system-ui, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  header h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }

  header p {
    color: #666;
    margin: 0;
  }

  .design-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 600px) {
    .design-list {
      grid-template-columns: 1fr;
    }
  }

  .design-card {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
  }

  .design-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .preview {
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Preview D */
  .preview-d {
    background: #0f0f14;
    border-bottom: 1px solid #222;
    flex-direction: column;
    gap: 12px;
  }

  .neon-title {
    font-weight: 800;
    font-size: 1.3rem;
    line-height: 1.2;
    text-align: center;
    background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .neon-title span {
    font-size: 1.5rem;
  }

  .neon-dots {
    display: flex;
    gap: 8px;
  }

  .ndot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  /* Design info */
  .design-info {
    padding: 1rem 1.25rem;
  }

  .label {
    display: inline-block;
    background: #f0f0f0;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #555;
    margin-bottom: 0.4rem;
  }

  .design-info h2 {
    font-size: 1rem;
    margin: 0 0 0.3rem;
  }

  .design-info p {
    font-size: 0.83rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
</style>
