<script lang="ts">
  import { resolve } from "$app/paths"

  const contentLinks = [
    {
      href: resolve("/guide"),
      title: "PCCSとは？",
      desc: "色相とトーンで体系化された色彩のしくみ。まずはここから。",
      featured: true
    },
    { href: "#", title: "PCCSの色相", desc: "24色相の配置と色名の対応を理解する" },
    { href: "#", title: "PCCSのトーン", desc: "明度・彩度をまとめた17のトーン区分" },
    { href: "#", title: "配色の基本", desc: "類似色・補色など基本的な配色の関係" },
    { href: "#", title: "色のイメージ", desc: "トーンごとの印象と感情的な効果" }
  ]

  const toolLinks = [
    {
      href: resolve("/approximate"),
      title: "色のPCCS近似",
      desc: "入力した色のPCCS値と慣用色名を調べる",
      color: "#e63946",
      label: "近似"
    },
    {
      href: resolve("/analyze"),
      title: "配色の分析",
      desc: "PCCSの色相・トーンに基づいて配色を分析する",
      color: "#118ab2",
      label: "分析"
    },
    {
      href: resolve("/patterns"),
      title: "配色シミュレータ",
      desc: "イメージに合う色の組み合わせを実験する",
      color: "#06d6a0",
      label: "実験"
    }
  ]

  const paintColors = ["#e63946", "#f4a261", "#e9c46a", "#06d6a0", "#118ab2", "#9b5de5", "#c77dff"]
</script>

<svelte:head>
  <title>PCCS Lens - 案H ペンキ</title>
</svelte:head>

<div class="page">
  <!-- Site header -->
  <header class="site-header">
    <div class="header-inner">
      <a href={resolve("/")} class="site-name" aria-label="PCCS Lens トップへ">
        <span class="site-name-pccs">PCCS</span>
        <span class="site-name-lens">Lens</span>
      </a>
      <nav class="site-nav" aria-label="メインナビゲーション">
        <a href="#content" class="nav-link" style="--nc:#e63946">コンテンツ</a>
        <a href="#tools" class="nav-link" style="--nc:#118ab2">ツール</a>
      </nav>
    </div>
    <!-- Paint drip bar at header bottom -->
    <div class="header-drip-bar" aria-hidden="true">
      {#each paintColors as color, i (color)}
        <div class="hd-col" style="background:{color}">
          <div
            class="hd-drip"
            style="--dh:{14 + (i % 3) * 10}px; --dl:{((i * 41) % 65) + 18}%"
          ></div>
        </div>
      {/each}
    </div>
  </header>

  <main>
    <!-- Hero (ヘッダー下のスペースを確保) -->
    <header class="hero">
      <h1>
        <span class="h1-block h1-pccs">PCCS</span>
        <span class="h1-block h1-lens">Lens</span>
      </h1>
      <p class="tagline">色をPCCSというレンズを通して見る</p>
      <p class="subtitle">ペンキを塗るように、大胆に、鮮やかに色を学ぼう</p>

      <!-- Paint swatches row -->
      <div class="swatch-row" aria-hidden="true">
        {#each paintColors as color (color)}
          <div class="swatch" style="background:{color}"></div>
        {/each}
      </div>
    </header>

    <!-- Contents -->
    <section id="content" class="section">
      <div class="section-label">
        <div class="label-paint" style="background:#1a1a1a"></div>
        <span>コンテンツ</span>
      </div>

      <!-- Featured: PCCSとは？ -->
      <a href={contentLinks[0].href} class="featured-card">
        <div class="featured-stripe"></div>
        <div class="featured-inner">
          <div class="featured-icon" aria-hidden="true">
            <div class="paint-circle pc1"></div>
            <div class="paint-circle pc2"></div>
            <div class="paint-circle pc3"></div>
          </div>
          <div class="featured-body">
            <span class="badge badge-learn">学習</span>
            <h3>{contentLinks[0].title}</h3>
            <p>{contentLinks[0].desc}</p>
            <span class="read-cta">読む →</span>
          </div>
        </div>
      </a>

      <div class="content-grid">
        {#each contentLinks.slice(1) as link, i (link.title)}
          <a
            href={link.href}
            class="content-card"
            style="--accent:{paintColors[(i + 2) % paintColors.length]}"
          >
            <div class="content-accent-bar"></div>
            <span class="content-title">{link.title}</span>
            <span class="content-desc">{link.desc}</span>
          </a>
        {/each}
      </div>
    </section>

    <!-- Tools -->
    <section id="tools" class="section">
      <div class="section-label">
        <div class="label-paint" style="background:#1a1a1a"></div>
        <span>ツール</span>
      </div>
      <div class="tools-grid">
        {#each toolLinks as tool (tool.title)}
          <a href={tool.href} class="tool-card" style="--tc:{tool.color}">
            <div class="tool-header" style="background:{tool.color}">
              <span class="tool-label">{tool.label}</span>
            </div>
            <div class="tool-body">
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <footer class="page-footer">
      <a href={resolve("/")} class="back-link">← デザイン一覧に戻る</a>
    </footer>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
  }

  .page {
    min-height: 100vh;
    background: #ffffff;
  }

  /* Site header */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
  }

  .header-inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .site-name {
    display: flex;
    align-items: baseline;
    gap: 1px;
    text-decoration: none;
    line-height: 1;
  }

  .site-name-pccs {
    font-size: 1.1rem;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: -0.03em;
  }

  .site-name-lens {
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    background: linear-gradient(
      90deg,
      #e63946 0%,
      #f4a261 30%,
      #06d6a0 60%,
      #118ab2 80%,
      #9b5de5 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .site-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-link {
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a1a1a;
    text-decoration: none;
    padding: 6px 10px;
    position: relative;
    letter-spacing: 0.02em;
  }

  .nav-link::after {
    content: "";
    position: absolute;
    bottom: 2px;
    left: 10px;
    right: 10px;
    height: 2px;
    background: var(--nc);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.15s;
  }

  .nav-link:hover::after {
    transform: scaleX(1);
  }

  .nav-cta {
    font-size: 0.78rem;
    font-weight: 800;
    color: #ffffff;
    text-decoration: none;
    background: #1a1a1a;
    padding: 6px 14px;
    border-radius: 2px;
    margin-left: 0.5rem;
    letter-spacing: 0.04em;
    transition:
      background 0.15s,
      transform 0.1s;
  }

  .nav-cta:hover {
    background: #e63946;
    transform: translateY(-1px);
  }

  /* Header drip bar */
  .header-drip-bar {
    display: flex;
    height: 5px;
    position: relative;
  }

  .hd-col {
    flex: 1;
    height: 5px;
    position: relative;
  }

  .hd-drip {
    position: absolute;
    bottom: calc(-1 * var(--dh));
    left: var(--dl);
    width: 6px;
    height: calc(var(--dh) + 3px);
    background: inherit;
    border-radius: 0 0 4px 4px;
  }

  /* Layout */
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 2.5rem 0 3rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    line-height: 0.95;
  }

  .h1-block {
    display: block;
  }

  .h1-pccs {
    font-size: 4rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #1a1a1a;
  }

  .h1-lens {
    font-size: 4.5rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    background: linear-gradient(
      90deg,
      #e63946 0%,
      #f4a261 25%,
      #e9c46a 45%,
      #06d6a0 65%,
      #118ab2 82%,
      #9b5de5 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 0.4rem;
    letter-spacing: 0.01em;
  }

  .subtitle {
    font-size: 0.88rem;
    color: #708090;
    margin: 0 0 1.5rem;
    line-height: 1.7;
  }

  .swatch-row {
    display: flex;
    justify-content: center;
    gap: 0;
    height: 28px;
    border-radius: 4px;
    overflow: hidden;
    max-width: 320px;
    margin: 0 auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }

  .swatch {
    flex: 1;
  }

  /* Section label */
  .section {
    margin-bottom: 2.5rem;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #1a1a1a;
  }

  .label-paint {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    transform: rotate(10deg);
  }

  /* Featured card */
  .featured-card {
    display: block;
    border: 2px solid #1a1a1a;
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    margin-bottom: 0.75rem;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }

  .featured-card:hover {
    transform: translateY(-3px);
    box-shadow: 4px 4px 0 #1a1a1a;
  }

  .featured-stripe {
    height: 6px;
    background: linear-gradient(
      90deg,
      #e63946,
      #f4a261,
      #e9c46a,
      #06d6a0,
      #118ab2,
      #9b5de5,
      #c77dff
    );
  }

  .featured-inner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    .featured-inner {
      flex-direction: column;
    }
    .featured-icon {
      display: none;
    }
  }

  .featured-icon {
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    position: relative;
  }

  .paint-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.9;
  }

  .pc1 {
    width: 52px;
    height: 52px;
    background: #e63946;
    top: 0;
    left: 0;
  }

  .pc2 {
    width: 40px;
    height: 40px;
    background: #118ab2;
    bottom: 0;
    right: 0;
  }

  .pc3 {
    width: 30px;
    height: 30px;
    background: #e9c46a;
    top: 20px;
    right: 5px;
    mix-blend-mode: multiply;
  }

  .featured-body {
    flex: 1;
  }

  .badge {
    display: inline-block;
    font-size: 0.67rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 2px;
    margin-bottom: 0.5rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .badge-learn {
    background: #e9c46a;
    color: #1a1a1a;
  }

  .featured-body h3 {
    font-size: 1.4rem;
    font-weight: 900;
    color: #1a1a1a;
    margin: 0 0 0.4rem;
    letter-spacing: -0.01em;
  }

  .featured-body p {
    font-size: 0.85rem;
    color: #708090;
    margin: 0 0 0.7rem;
    line-height: 1.6;
  }

  .read-cta {
    font-size: 0.85rem;
    font-weight: 800;
    color: #1a1a1a;
    border-bottom: 2px solid #e63946;
    padding-bottom: 1px;
  }

  /* Content grid */
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  @media (max-width: 480px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  .content-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.9rem 1rem;
    border: 1.5px solid #e0e0e0;
    border-radius: 3px;
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.15s,
      transform 0.15s,
      box-shadow 0.15s;
  }

  .content-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 2px 2px 0 var(--accent);
  }

  .content-accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--accent);
  }

  .content-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1a1a1a;
    padding-left: 0.4rem;
  }

  .content-desc {
    font-size: 0.76rem;
    color: #708090;
    line-height: 1.5;
    padding-left: 0.4rem;
  }

  /* Tools */
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
  }

  @media (max-width: 540px) {
    .tools-grid {
      grid-template-columns: 1fr;
    }
  }

  .tool-card {
    display: flex;
    flex-direction: column;
    border: 1.5px solid #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition:
      border-color 0.15s,
      transform 0.15s,
      box-shadow 0.15s;
  }

  .tool-card:hover {
    border-color: var(--tc);
    transform: translateY(-3px);
    box-shadow: 2px 3px 0 var(--tc);
  }

  .tool-header {
    padding: 0.6rem 0.85rem;
    display: flex;
    align-items: center;
  }

  .tool-label {
    font-size: 0.67rem;
    font-weight: 800;
    color: white;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .tool-body {
    padding: 0.75rem 0.85rem 0.9rem;
    flex: 1;
  }

  .tool-body h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 0.3rem;
  }

  .tool-body p {
    font-size: 0.74rem;
    color: #708090;
    margin: 0;
    line-height: 1.5;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 2px solid #1a1a1a;
    text-align: center;
  }

  .back-link {
    font-size: 0.83rem;
    font-weight: 700;
    color: #708090;
    text-decoration: none;
  }

  .back-link:hover {
    color: #1a1a1a;
  }
</style>
