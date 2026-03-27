<script lang="ts">
  import { resolve } from "$app/paths"

  const swatches = [
    { color: "#d4aaff", label: "v" },
    { color: "#ffb3c6", label: "sf" },
    { color: "#ffd6a5", label: "p" },
    { color: "#ffffa3", label: "p" },
    { color: "#b8f0b8", label: "lt" },
    { color: "#a0c4ff", label: "b" }
  ]
</script>

<svelte:head>
  <title>PCCS Lens - 案F カラーパネル</title>
</svelte:head>

<div class="hero-section">
  <div class="hero-deco">
    <svg class="deco-svg" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="340" cy="40" r="90" fill="#e8d5ff" opacity="0.6" />
      <circle cx="60" cy="160" r="70" fill="#ffd6e8" opacity="0.5" />
      <circle cx="200" cy="180" r="60" fill="#c8f0e0" opacity="0.4" />
      <circle cx="380" cy="160" r="50" fill="#c8e0ff" opacity="0.5" />
    </svg>
  </div>
  <div class="hero-inner">
    <div class="swatch-row">
      {#each swatches as s (s.color)}
        <div class="hero-swatch" style="background: {s.color}"></div>
      {/each}
    </div>
    <h1>
      PCCS <em>Lens</em>
    </h1>
    <p class="tagline">色をPCCSというレンズを通して見る</p>
    <p class="description">色相・トーン・彩度の体系「PCCS」で、配色の理論を直感的に学ぼう。</p>
  </div>
</div>

<main>
  <div class="two-col">
    <section class="col-learn">
      <div class="col-label">
        <span class="label-dot dot-purple"></span>
        PCCSを知る
      </div>
      <a href={resolve("/guide")} class="learn-card">
        <div class="learn-top">
          <div class="tone-grid">
            {#each ["#f5e6ff", "#e8c8ff", "#d4a0ff", "#b866ff", "#9933dd", "#7010bb", "#4d0099", "#2d0066"] as c (c)}
              <div class="tone-cell" style="background: {c}"></div>
            {/each}
          </div>
        </div>
        <div class="learn-foot">
          <span class="learn-tag">まずはここから</span>
          <h2>PCCSとは？</h2>
          <p>色相・トーンについて学ぶ日本発の色彩システム。色の関係性を体系的に理解できます。</p>
          <span class="learn-cta">ガイドを読む →</span>
        </div>
      </a>
    </section>

    <section class="col-tools">
      <div class="col-label">
        <span class="label-dot dot-teal"></span>
        ツールを使う
      </div>
      <div class="tool-list">
        <a
          href={resolve("/approximate")}
          class="tool-item"
          style="--mark: #e8a0bf; --markdark: #b03070"
        >
          <div class="tool-mark"></div>
          <div class="tool-text">
            <div class="tool-name">色のPCCS近似</div>
            <div class="tool-desc">入力した色に近いPCCS値と慣用色名を調べる</div>
          </div>
          <span class="tool-arrow">→</span>
        </a>
        <a
          href={resolve("/analyze")}
          class="tool-item"
          style="--mark: #80d4b0; --markdark: #1a8060"
        >
          <div class="tool-mark"></div>
          <div class="tool-text">
            <div class="tool-name">配色の分析</div>
            <div class="tool-desc">配色をPCCSの色相・トーンに基づいて分析する</div>
          </div>
          <span class="tool-arrow">→</span>
        </a>
        <a
          href={resolve("/patterns")}
          class="tool-item"
          style="--mark: #90b8ff; --markdark: #1a50c0"
        >
          <div class="tool-mark"></div>
          <div class="tool-text">
            <div class="tool-name">配色シミュレータ</div>
            <div class="tool-desc">イメージに合う色の組み合わせを実験する</div>
          </div>
          <span class="tool-arrow">→</span>
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
    background: #fff;
    color: #1e1530;
  }

  /* Hero */
  .hero-section {
    background: linear-gradient(135deg, #ede0ff 0%, #fce4f0 50%, #dff0ff 100%);
    padding: 3.5rem 1.5rem 3rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .hero-deco {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .deco-svg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
  }

  .hero-inner {
    position: relative;
    max-width: 640px;
    margin: 0 auto;
  }

  .swatch-row {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 1.5rem;
  }

  .hero-swatch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .hero-inner h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
    color: #2d1060;
  }

  .hero-inner h1 em {
    font-style: normal;
    background: linear-gradient(135deg, #8833ee, #dd44aa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.1rem;
    font-weight: 600;
    color: #5c30a0;
    margin: 0 0 0.6rem;
  }

  .description {
    font-size: 0.9rem;
    color: #7050a0;
    margin: 0;
    line-height: 1.6;
  }

  /* Main content */
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 600px) {
    .two-col {
      grid-template-columns: 1fr;
    }
  }

  .col-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6a5080;
    margin-bottom: 0.75rem;
  }

  .label-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot-purple {
    background: #a060f0;
  }

  .dot-teal {
    background: #40c090;
  }

  /* Learn card */
  .learn-card {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #e8d8ff;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .learn-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(140, 80, 240, 0.18);
  }

  .learn-top {
    background: linear-gradient(135deg, #f0e0ff, #ffd8f0);
    padding: 1.25rem 1.25rem 1rem;
  }

  .tone-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    border-radius: 6px;
    overflow: hidden;
  }

  .tone-cell {
    height: 28px;
  }

  .learn-foot {
    padding: 1rem 1.25rem 1.25rem;
  }

  .learn-tag {
    display: inline-block;
    background: #f0e0ff;
    color: #8030d0;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 0.4rem;
  }

  .learn-foot h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: #2d1060;
  }

  .learn-foot p {
    font-size: 0.82rem;
    color: #7a6090;
    margin: 0 0 0.65rem;
    line-height: 1.55;
  }

  .learn-cta {
    font-size: 0.83rem;
    font-weight: 600;
    color: #8030d0;
  }

  /* Tool list */
  .tool-list {
    display: flex;
    flex-direction: column;
    border: 1px solid #e8e0f0;
    border-radius: 14px;
    overflow: hidden;
    background: white;
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f0eaf8;
    transition: background 0.15s;
    position: relative;
  }

  .tool-item:last-child {
    border-bottom: none;
  }

  .tool-item:hover {
    background: #faf6ff;
  }

  .tool-item:hover .tool-mark {
    opacity: 1;
  }

  .tool-mark {
    width: 4px;
    align-self: stretch;
    background: var(--mark);
    border-radius: 2px;
    flex-shrink: 0;
    opacity: 0.4;
    transition: opacity 0.15s;
  }

  .tool-text {
    flex: 1;
  }

  .tool-name {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--markdark);
    margin-bottom: 2px;
  }

  .tool-desc {
    font-size: 0.78rem;
    color: #8a7a9a;
    line-height: 1.4;
  }

  .tool-arrow {
    color: #c0b0d8;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #ece4f8;
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
