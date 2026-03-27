<script lang="ts">
  import { resolve } from "$app/paths"

  const contentLinks = [
    {
      href: resolve("/guide"),
      title: "PCCSとは？",
      desc: "色相とトーンで体系化された色彩のしくみ。まずはここから。",
      featured: true
    },
    { href: "#", title: "PCCSの色相", desc: "24色相の配置と色名の対応を理解する", featured: false },
    {
      href: "#",
      title: "PCCSのトーン",
      desc: "明度・彩度をまとめた17のトーン区分",
      featured: false
    },
    { href: "#", title: "配色の基本", desc: "類似色・補色など基本的な配色の関係", featured: false },
    { href: "#", title: "色のイメージ", desc: "トーンごとの印象と感情的な効果", featured: false }
  ]

  const toolLinks = [
    {
      href: resolve("/approximate"),
      title: "色のPCCS近似",
      desc: "入力した色のPCCS値と慣用色名を調べる",
      color: "#e76f51"
    },
    {
      href: resolve("/analyze"),
      title: "配色の分析",
      desc: "PCCSの色相・トーンに基づいて配色を分析する",
      color: "#2a9d8f"
    },
    {
      href: resolve("/patterns"),
      title: "配色シミュレータ",
      desc: "イメージに合う色の組み合わせを実験する",
      color: "#6a4c93"
    }
  ]
</script>

<svelte:head>
  <title>PCCS Lens - 案G 水彩</title>
</svelte:head>

<div class="page">
  <!-- watercolor background blobs -->
  <div class="wc-bg" aria-hidden="true">
    <div class="blob blob-red"></div>
    <div class="blob blob-yellow"></div>
    <div class="blob blob-green"></div>
    <div class="blob blob-blue"></div>
    <div class="blob blob-purple"></div>
    <div class="blob blob-orange"></div>
  </div>

  <main>
    <!-- Hero -->
    <header class="hero">
      <div class="splash-dots" aria-hidden="true">
        {#each ["#e63946", "#e9c46a", "#2a9d8f", "#457b9d", "#9b5de5"] as c, i (c)}
          <div class="sdot" style="background:{c}; --i:{i}"></div>
        {/each}
      </div>
      <h1>
        <span class="h1-pccs">PCCS</span>
        <span class="h1-lens">Lens</span>
      </h1>
      <p class="tagline">色をPCCSというレンズを通して見る</p>
      <p class="subtitle">色彩の理論を、水彩画のように豊かに、やさしく学ぼう</p>
    </header>

    <!-- Contents -->
    <section class="section">
      <h2 class="section-heading">
        <span class="section-heading-ink">コンテンツ</span>
      </h2>

      <a href={contentLinks[0].href} class="featured-card">
        <div class="featured-wash"></div>
        <div class="featured-body">
          <span class="tag tag-learn">学習</span>
          <h3>{contentLinks[0].title}</h3>
          <p>{contentLinks[0].desc}</p>
          <span class="cta-link">読む →</span>
        </div>
        <div class="featured-deco" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="120" height="120">
            {#each Array(12) as _, i (i)}
              {@const angle = i * 30 * (Math.PI / 180)}
              {@const r1 = 28}
              {@const r2 = 50}
              {@const x1 = 60 + r1 * Math.cos(angle)}
              {@const y1 = 60 + r1 * Math.sin(angle)}
              {@const x2 = 60 + r2 * Math.cos(angle)}
              {@const y2 = 60 + r2 * Math.sin(angle)}
              <line
                {x1}
                {y1}
                {x2}
                {y2}
                stroke={`hsl(${i * 30}, 65%, 55%)`}
                stroke-width="7"
                stroke-linecap="round"
                opacity="0.7"
              />
            {/each}
            <circle cx="60" cy="60" r="22" fill="white" opacity="0.9" />
            <text x="60" y="64" text-anchor="middle" font-size="9" font-weight="700" fill="#555">
              PCCS
            </text>
          </svg>
        </div>
      </a>

      <div class="content-grid">
        {#each contentLinks.slice(1) as link (link.title)}
          <a href={link.href} class="content-card">
            <div class="content-card-wash"></div>
            <span class="content-title">{link.title}</span>
            <span class="content-desc">{link.desc}</span>
          </a>
        {/each}
      </div>
    </section>

    <!-- Tools -->
    <section class="section">
      <h2 class="section-heading">
        <span class="section-heading-ink">ツール</span>
      </h2>
      <div class="tools-grid">
        {#each toolLinks as tool (tool.title)}
          <a href={tool.href} class="tool-card" style="--tc:{tool.color}">
            <div class="tool-wash" style="background:{tool.color}"></div>
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
    position: relative;
    min-height: 100vh;
    background: #ffffff;
    overflow: hidden;
  }

  /* Watercolor blobs */
  .wc-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .blob {
    position: absolute;
    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
    filter: blur(48px);
    opacity: 0.13;
  }

  .blob-red {
    width: 400px;
    height: 340px;
    background: #e63946;
    top: -80px;
    left: -80px;
  }
  .blob-yellow {
    width: 300px;
    height: 260px;
    background: #f4a261;
    top: 60px;
    right: 5%;
    border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%;
  }
  .blob-green {
    width: 360px;
    height: 300px;
    background: #2a9d8f;
    top: 40%;
    left: -60px;
    border-radius: 70% 30% 50% 50% / 30% 70% 40% 60%;
  }
  .blob-blue {
    width: 280px;
    height: 320px;
    background: #457b9d;
    bottom: 10%;
    right: -40px;
    border-radius: 50% 50% 30% 70% / 60% 40% 70% 30%;
  }
  .blob-purple {
    width: 320px;
    height: 280px;
    background: #9b5de5;
    top: 55%;
    right: 20%;
    border-radius: 30% 70% 60% 40% / 50% 30% 70% 50%;
  }
  .blob-orange {
    width: 240px;
    height: 200px;
    background: #e9c46a;
    bottom: 5%;
    left: 20%;
    border-radius: 60% 40% 50% 50% / 40% 60% 30% 70%;
  }

  /* Layout */
  main {
    position: relative;
    z-index: 1;
    max-width: 680px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 3rem 0 3.5rem;
  }

  .splash-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 1.25rem;
  }

  .sdot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    opacity: 0.75;
    filter: blur(0.5px);
    transform: translateY(calc(var(--i) % 2 * 4px - 2px));
  }

  h1 {
    font-size: 3.5rem;
    font-weight: 900;
    margin: 0 0 0.75rem;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .h1-pccs {
    color: #1a1a1a;
  }

  .h1-lens {
    background: linear-gradient(
      120deg,
      #e63946 0%,
      #f4a261 30%,
      #2a9d8f 60%,
      #457b9d 80%,
      #9b5de5 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.05rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 0.5rem;
  }

  .subtitle {
    font-size: 0.88rem;
    color: #708090;
    margin: 0;
    line-height: 1.7;
  }

  /* Section */
  .section {
    margin-bottom: 2.5rem;
  }

  .section-heading {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #708090;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .section-heading::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #ddd 0%, transparent 100%);
  }

  /* Featured card */
  .featured-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    padding: 1.75rem 1.5rem;
    border: 1.5px solid #e8e0f0;
    border-radius: 1rem;
    text-decoration: none;
    color: inherit;
    background: white;
    overflow: hidden;
    margin-bottom: 1rem;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }

  .featured-card:hover {
    border-color: #c4b5e8;
    box-shadow: 0 6px 24px rgba(155, 93, 229, 0.1);
    transform: translateY(-2px);
  }

  .featured-wash {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(230, 57, 70, 0.04) 0%,
      rgba(154, 93, 229, 0.06) 60%,
      rgba(69, 123, 157, 0.04) 100%
    );
    pointer-events: none;
  }

  .featured-body {
    position: relative;
    flex: 1;
  }

  .tag {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    border-radius: 20px;
    padding: 2px 9px;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
  }

  .tag-learn {
    background: rgba(233, 196, 106, 0.25);
    color: #8a6300;
    border: 1px solid rgba(233, 196, 106, 0.6);
  }

  .featured-body h3 {
    font-size: 1.35rem;
    font-weight: 800;
    margin: 0 0 0.4rem;
    color: #1a1a1a;
  }

  .featured-body p {
    font-size: 0.85rem;
    color: #708090;
    margin: 0 0 0.75rem;
    line-height: 1.6;
  }

  .cta-link {
    font-size: 0.82rem;
    font-weight: 700;
    color: #9b5de5;
  }

  .featured-deco {
    flex-shrink: 0;
    opacity: 0.85;
  }

  @media (max-width: 480px) {
    .featured-deco {
      display: none;
    }
  }

  /* Content grid */
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  .content-card {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1rem 1.1rem;
    border: 1px solid #e8e0f0;
    border-radius: 0.75rem;
    text-decoration: none;
    color: inherit;
    background: white;
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }

  .content-card:hover {
    border-color: #c4d8f0;
    box-shadow: 0 4px 16px rgba(69, 123, 157, 0.1);
    transform: translateY(-2px);
  }

  .content-card-wash {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(69, 123, 157, 0.04), rgba(42, 157, 143, 0.04));
    pointer-events: none;
  }

  .content-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1a1a1a;
    position: relative;
  }

  .content-desc {
    font-size: 0.78rem;
    color: #708090;
    line-height: 1.5;
    position: relative;
  }

  /* Tools grid */
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 540px) {
    .tools-grid {
      grid-template-columns: 1fr;
    }
  }

  .tool-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #e8e0f0;
    border-radius: 0.75rem;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    background: white;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }

  .tool-card:hover {
    border-color: color-mix(in srgb, var(--tc) 40%, transparent);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--tc) 15%, transparent);
    transform: translateY(-2px);
  }

  .tool-wash {
    height: 4px;
    opacity: 0.7;
  }

  .tool-body {
    padding: 1rem 1rem 1.1rem;
    flex: 1;
  }

  .tool-body h3 {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 0.35rem;
  }

  .tool-body p {
    font-size: 0.76rem;
    color: #708090;
    margin: 0;
    line-height: 1.5;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
    text-align: center;
  }

  .back-link {
    font-size: 0.83rem;
    color: #708090;
    text-decoration: none;
  }

  .back-link:hover {
    color: #457b9d;
  }
</style>
