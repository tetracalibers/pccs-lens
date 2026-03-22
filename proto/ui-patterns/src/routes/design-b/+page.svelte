<script lang="ts">
  import { resolve } from "$app/paths"

  // Simplified 12 hues for the wheel
  const wheelHues = [
    "#e03131",
    "#e8590c",
    "#f59f00",
    "#e9c500",
    "#94d82d",
    "#2f9e44",
    "#0c8599",
    "#1971c2",
    "#3b5bdb",
    "#6741d9",
    "#9c36b5",
    "#c2255c"
  ]

  const tools = [
    {
      href: resolve("/approximate"),
      color: "#f59f00",
      icon: "🎯",
      title: "色のPCCS近似",
      desc: "入力した色に近いPCCS値と慣用色名を調べる"
    },
    {
      href: resolve("/analyze"),
      color: "#2f9e44",
      icon: "📊",
      title: "配色の分析",
      desc: "配色をPCCSの色相・トーンに基づいて分析する"
    },
    {
      href: resolve("/patterns"),
      color: "#3b5bdb",
      icon: "🎨",
      title: "配色シミュレータ",
      desc: "イメージに合う色の組み合わせを実験する"
    }
  ]
</script>

<svelte:head>
  <title>PCCS Lens - 案B 色相環ビジュアル</title>
</svelte:head>

<main>
  <div class="hero">
    <div class="wheel-wrap">
      <svg class="wheel" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer color segments -->
        {#each wheelHues as color, i (color)}
          {@const a1 = (i / 12) * 2 * Math.PI - Math.PI / 2}
          {@const a2 = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2}
          {@const r = 46}
          {@const ir = 22}
          {@const x1 = 50 + r * Math.cos(a1)}
          {@const y1 = 50 + r * Math.sin(a1)}
          {@const x2 = 50 + r * Math.cos(a2)}
          {@const y2 = 50 + r * Math.sin(a2)}
          {@const ix1 = 50 + ir * Math.cos(a2)}
          {@const iy1 = 50 + ir * Math.sin(a2)}
          {@const ix2 = 50 + ir * Math.cos(a1)}
          {@const iy2 = 50 + ir * Math.sin(a1)}
          <path
            d="M {ix2} {iy2} L {x1} {y1} A {r} {r} 0 0 1 {x2} {y2} L {ix1} {iy1} A {ir} {ir} 0 0 0 {ix2} {iy2} Z"
            fill={color}
            opacity="0.9"
          />
        {/each}
        <!-- White center -->
        <circle cx="50" cy="50" r="20" fill="white" />
        <text x="50" y="46" text-anchor="middle" font-size="4.5" font-weight="700" fill="#1a1a1a">
          PCCS
        </text>
        <text x="50" y="55" text-anchor="middle" font-size="4.5" font-weight="700" fill="#1a1a1a">
          Lens
        </text>
      </svg>
    </div>
    <div class="hero-text">
      <h1>
        PCCS <em>Lens</em>
      </h1>
      <p class="tagline">
        色相環のことばで、
        <br />
        色を読み、色を語る。
      </p>
      <p class="desc">
        PCCSは日本の色彩研究所が開発した体系的な色彩システム。色を「色相」と「トーン」で整理し、色の関係性を論理的に捉えます。
      </p>
    </div>
  </div>

  <div class="content">
    <section class="guide-section">
      <a href={resolve("/guide")} class="guide-card">
        <div class="guide-wheel-mini">
          <svg viewBox="0 0 100 100" width="56" height="56">
            {#each wheelHues as color, i (color)}
              {@const a1 = (i / 12) * 2 * Math.PI - Math.PI / 2}
              {@const a2 = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2}
              {@const r = 46}
              {@const ir = 22}
              {@const x1 = 50 + r * Math.cos(a1)}
              {@const y1 = 50 + r * Math.sin(a1)}
              {@const x2 = 50 + r * Math.cos(a2)}
              {@const y2 = 50 + r * Math.sin(a2)}
              {@const ix1 = 50 + ir * Math.cos(a2)}
              {@const iy1 = 50 + ir * Math.sin(a2)}
              {@const ix2 = 50 + ir * Math.cos(a1)}
              {@const iy2 = 50 + ir * Math.sin(a1)}
              <path
                d="M {ix2} {iy2} L {x1} {y1} A {r} {r} 0 0 1 {x2} {y2} L {ix1} {iy1} A {ir} {ir} 0 0 0 {ix2} {iy2} Z"
                fill={color}
              />
            {/each}
            <circle cx="50" cy="50" r="20" fill="white" />
          </svg>
        </div>
        <div class="guide-body">
          <div class="guide-tag">まずはここから</div>
          <h2>PCCSとは？</h2>
          <p>PCCSの色相とトーンについて学ぶ</p>
          <span class="guide-cta">ガイドを読む →</span>
        </div>
      </a>
    </section>

    <section class="tools-section">
      <h2 class="tools-title">ツール</h2>
      <div class="tools-list">
        {#each tools as tool (tool.title)}
          <a href={tool.href} class="tool-row" style="--c: {tool.color}">
            <div class="tool-dot" style="background: {tool.color}"></div>
            <div class="tool-body">
              <span class="tool-icon">{tool.icon}</span>
              <div>
                <div class="tool-name">{tool.title}</div>
                <div class="tool-desc">{tool.desc}</div>
              </div>
            </div>
            <span class="tool-arrow">→</span>
          </a>
        {/each}
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
    font-family: "Helvetica Neue", Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
    background: #f7f7f5;
    color: #1a1a1a;
  }

  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Hero */
  .hero {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    padding: 3.5rem 0 2.5rem;
  }

  @media (max-width: 580px) {
    .hero {
      flex-direction: column;
      text-align: center;
    }
  }

  .wheel-wrap {
    flex-shrink: 0;
  }

  .wheel {
    width: 200px;
    height: 200px;
    filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15));
  }

  .hero-text h1 {
    font-size: 2.4rem;
    font-weight: 800;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  .hero-text h1 em {
    font-style: normal;
    background: linear-gradient(135deg, #1971c2, #6741d9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.6;
    margin: 0 0 0.75rem;
    color: #333;
  }

  .desc {
    font-size: 0.88rem;
    color: #666;
    line-height: 1.7;
    margin: 0;
  }

  /* Content */
  .content {
    display: grid;
    gap: 1.5rem;
  }

  /* Guide */
  .guide-card {
    display: flex;
    gap: 1.25rem;
    align-items: center;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
  }

  .guide-card:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .guide-tag {
    display: inline-block;
    background: #fff3cd;
    color: #9a6700;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 0.4rem;
  }

  .guide-body h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
  }

  .guide-body p {
    font-size: 0.85rem;
    color: #666;
    margin: 0 0 0.6rem;
  }

  .guide-cta {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1971c2;
  }

  /* Tools */
  .tools-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 0.75rem;
  }

  .tools-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
  }

  .tool-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.15s;
    position: relative;
  }

  .tool-row:last-child {
    border-bottom: none;
  }

  .tool-row:hover {
    background: #fafafa;
  }

  .tool-row::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--c);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .tool-row:hover::before {
    opacity: 1;
  }

  .tool-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tool-body {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .tool-icon {
    font-size: 1.2rem;
  }

  .tool-name {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .tool-desc {
    font-size: 0.8rem;
    color: #888;
    margin-top: 1px;
  }

  .tool-arrow {
    color: #bbb;
    font-size: 1rem;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
    text-align: center;
  }

  .back-link {
    font-size: 0.85rem;
    color: #888;
    text-decoration: none;
  }

  .back-link:hover {
    color: #333;
  }
</style>
