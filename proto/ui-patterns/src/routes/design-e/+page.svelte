<script lang="ts">
  import { resolve } from "$app/paths"
</script>

<svelte:head>
  <title>PCCS Lens - 案E ソフトパステル</title>
</svelte:head>

<div class="gradient-bar"></div>

<main>
  <header class="hero">
    <h1>
      PCCS <span class="lens-word">Lens</span>
    </h1>
    <p class="tagline">色をPCCSというレンズを通して見る</p>
    <p class="description">日本発の色彩システム「PCCS」で、色の関係性をもっと深く理解しよう。</p>
  </header>

  <div class="content">
    <section class="section">
      <h2 class="section-heading">
        <span class="section-dot dot-learn"></span>
        PCCSを知る
      </h2>
      <a href={resolve("/guide")} class="learn-card">
        <div class="learn-palette">
          {#each ["#d4aaff", "#ffb3c6", "#ffd6a5", "#ffffa3", "#b8f0b8", "#a0c4ff"] as color (color)}
            <div class="palette-dot" style="background: {color}"></div>
          {/each}
        </div>
        <div class="learn-body">
          <span class="learn-badge">はじめての方へ</span>
          <h3>PCCSとは？</h3>
          <p>色相・トーンについて学ぶ</p>
          <span class="learn-cta">ガイドを読む →</span>
        </div>
      </a>
    </section>

    <section class="section">
      <h2 class="section-heading">
        <span class="section-dot dot-tools"></span>
        ツールを使う
      </h2>
      <div class="tools-grid">
        <a
          href={resolve("/approximate")}
          class="tool-card"
          style="--pastel: #ffe0ee; --accent: #c2185b"
        >
          <div class="tool-color-strip"></div>
          <div class="tool-body">
            <h3>色のPCCS近似</h3>
            <p>入力した色に近いPCCS値と慣用色名を調べる</p>
          </div>
        </a>
        <a
          href={resolve("/analyze")}
          class="tool-card"
          style="--pastel: #d0f5e8; --accent: #1b7a50"
        >
          <div class="tool-color-strip"></div>
          <div class="tool-body">
            <h3>配色の分析</h3>
            <p>配色をPCCSの色相・トーンに基づいて分析する</p>
          </div>
        </a>
        <a
          href={resolve("/patterns")}
          class="tool-card"
          style="--pastel: #dde8ff; --accent: #2553c4"
        >
          <div class="tool-color-strip"></div>
          <div class="tool-body">
            <h3>配色シミュレータ</h3>
            <p>イメージに合う色の組み合わせを実験する</p>
          </div>
        </a>
      </div>
    </section>
  </div>

  <footer class="page-footer">
    <a href={resolve("/")} class="back-link">← デザイン一覧に戻る</a>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #faf6ff;
    color: #2d2040;
  }

  .gradient-bar {
    height: 5px;
    background: linear-gradient(
      90deg,
      #d4aaff 0%,
      #ffb3c6 30%,
      #ffd6a5 55%,
      #b8f0b8 75%,
      #a0c4ff 100%
    );
  }

  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 3rem 0 2.5rem;
  }

  .hero h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 0.75rem;
    color: #2d2040;
    letter-spacing: -0.02em;
  }

  .lens-word {
    background: linear-gradient(135deg, #9c5bff, #e060a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.15rem;
    font-weight: 600;
    color: #5c3d8f;
    margin: 0 0 0.6rem;
  }

  .description {
    font-size: 0.9rem;
    color: #7a6490;
    margin: 0;
    line-height: 1.6;
  }

  /* Content */
  .content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7a6490;
    margin: 0 0 0.75rem;
  }

  .section-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot-learn {
    background: #b066ff;
  }

  .dot-tools {
    background: #60c0a0;
  }

  /* Learn card */
  .learn-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: linear-gradient(135deg, #f0e6ff, #ffe6f4);
    border-radius: 16px;
    padding: 1.75rem;
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .learn-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(160, 100, 255, 0.2);
  }

  .learn-palette {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    flex-shrink: 0;
  }

  .palette-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .learn-badge {
    display: inline-block;
    background: rgba(160, 80, 255, 0.15);
    color: #7030cc;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
    margin-bottom: 0.4rem;
  }

  .learn-body h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: #2d2040;
  }

  .learn-body p {
    font-size: 0.85rem;
    color: #7a6490;
    margin: 0 0 0.6rem;
  }

  .learn-cta {
    font-size: 0.85rem;
    font-weight: 600;
    color: #8040c0;
  }

  /* Tools grid */
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 560px) {
    .tools-grid {
      grid-template-columns: 1fr;
    }

    .learn-card {
      flex-direction: column;
      text-align: center;
    }
  }

  .tool-card {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(100, 60, 180, 0.08);
  }

  .tool-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(100, 60, 180, 0.15);
  }

  .tool-color-strip {
    height: 8px;
    background: var(--pastel);
  }

  .tool-body {
    padding: 0.875rem 1rem 1rem;
  }

  .tool-body h3 {
    font-size: 0.92rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: var(--accent);
  }

  .tool-body p {
    font-size: 0.8rem;
    color: #7a6490;
    margin: 0;
    line-height: 1.5;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e4d8f5;
    text-align: center;
  }

  .back-link {
    font-size: 0.85rem;
    color: #9a80b8;
    text-decoration: none;
  }

  .back-link:hover {
    color: #6030a0;
  }
</style>
