<script lang="ts">
  import { resolve } from "$app/paths"

  let isLight = $state(false)

  const hueOrbs = [
    { color: "#ff6b6b", x: 15, y: 20, size: 160 },
    { color: "#ffd93d", x: 75, y: 60, size: 100 },
    { color: "#6bcb77", x: 50, y: 85, size: 120 },
    { color: "#4d96ff", x: 85, y: 20, size: 80 },
    { color: "#c77dff", x: 35, y: 65, size: 90 }
  ]

  const tools = [
    {
      href: resolve("/approximate"),
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
      glow: "#ff6b6b",
      title: "色のPCCS近似",
      desc: "入力した色のPCCS値と慣用色名を調べる",
      tag: "近似"
    },
    {
      href: resolve("/analyze"),
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)",
      glow: "#6bcb77",
      title: "配色の分析",
      desc: "PCCSの色相・トーンに基づいて配色を分析する",
      tag: "分析"
    },
    {
      href: resolve("/patterns"),
      gradient: "linear-gradient(135deg, #c77dff, #4d96ff)",
      glow: "#c77dff",
      title: "配色シミュレータ",
      desc: "イメージに合う色の組み合わせを実験する",
      tag: "実験"
    }
  ]
</script>

<svelte:head>
  <title>PCCS Lens - 案D ネオン ({isLight ? "ライト" : "ダーク"})</title>
</svelte:head>

<div class="page" class:light={isLight}>
  <!-- Ambient orbs background -->
  <div class="orbs-bg" aria-hidden="true">
    {#each hueOrbs as orb (orb.color)}
      <div
        class="orb"
        style="
					left: {orb.x}%;
					top: {orb.y}%;
					width: {orb.size}px;
					height: {orb.size}px;
					background: {orb.color};
				"
      ></div>
    {/each}
  </div>

  <!-- Mode toggle -->
  <div class="mode-toggle-wrap">
    <button class="mode-toggle" onclick={() => (isLight = !isLight)}>
      {isLight ? "🌙 ダークモードへ" : "☀️ ライトモードへ"}
    </button>
  </div>

  <main>
    <!-- Hero -->
    <header class="hero">
      <div class="hero-eyebrow">Color Theory System</div>
      <h1>
        <span class="h1-pccs">PCCS</span>
        <span class="h1-lens">Lens</span>
      </h1>
      <p class="tagline">すべての色に、名前をつけよう。</p>
      <p class="subtitle">日本色彩研究所が開発したPCCSで色を分析・理解・実験する</p>
      <div class="hue-strip">
        {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c (c)}
          <div class="hue-seg" style="background:{c}"></div>
        {/each}
      </div>
    </header>

    <!-- Guide -->
    <section class="guide-section">
      <a href={resolve("/guide")} class="guide-card">
        <div class="guide-card-inner">
          <div class="guide-visual">
            <div class="guide-orb-ring">
              {#each ["#e03131", "#f59f00", "#2f9e44", "#1971c2", "#6741d9", "#c2255c"] as c, i (c)}
                <div
                  class="ring-dot"
                  style="
										transform: rotate({i * 60}deg) translateY(-28px);
										background: {c};
										box-shadow: 0 0 8px {c};
									"
                ></div>
              {/each}
              <div class="ring-center">PCCS</div>
            </div>
          </div>
          <div class="guide-body">
            <span class="glass-tag">学習</span>
            <h2>PCCSとは？</h2>
            <p>色相とトーンで体系化された日本独自の色彩理論。まずここから。</p>
            <span class="neon-cta">→ 学習を始める</span>
          </div>
        </div>
      </a>
    </section>

    <!-- Tools -->
    <section class="tools-section">
      <div class="tools-header">
        <span class="tools-label">ツール</span>
        <div class="tools-divider"></div>
      </div>
      <div class="tools-grid">
        {#each tools as tool (tool.title)}
          <a href={tool.href} class="tool-glass" style="--glow: {tool.glow}">
            <div class="tool-gradient-bar" style="background: {tool.gradient}"></div>
            <div class="tool-glass-body">
              <span class="tool-glass-tag" style="color: {tool.glow}; border-color: {tool.glow}55">
                {tool.tag}
              </span>
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
  /* ===== BASE (DARK) ===== */
  :global(body) {
    margin: 0;
    font-family: "Helvetica Neue", Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
  }

  .page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: #0c0c14;
    color: #f0f0f0;
    transition:
      background 0.4s,
      color 0.4s;
  }

  /* Orbs */
  .orbs-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    transform: translate(-50%, -50%);
    opacity: 0.08;
    transition: opacity 0.4s;
  }

  .light .orb {
    opacity: 0.18;
  }

  /* Toggle */
  .mode-toggle-wrap {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.25rem 0;
    max-width: 720px;
    margin: 0 auto;
  }

  .mode-toggle {
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
    backdrop-filter: blur(8px);
  }

  .mode-toggle:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #eee;
  }

  .light .mode-toggle {
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.04);
    color: #555;
  }

  .light .mode-toggle:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #222;
  }

  /* Main */
  main {
    position: relative;
    z-index: 1;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 3rem 0 3rem;
  }

  .hero-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 1rem;
    transition: color 0.4s;
  }

  .light .hero-eyebrow {
    color: #999;
  }

  .hero h1 {
    font-size: 4rem;
    font-weight: 900;
    margin: 0 0 1rem;
    letter-spacing: -0.03em;
    line-height: 0.95;
  }

  .h1-pccs {
    display: block;
    color: #f0f0f0;
    transition: color 0.4s;
  }

  .light .h1-pccs {
    color: #1a1a1a;
  }

  .h1-lens {
    display: block;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff, #ff6b6b);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: hue-shift 6s linear infinite;
  }

  @keyframes hue-shift {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }

  .tagline {
    font-size: 1.1rem;
    font-weight: 600;
    color: #ddd;
    margin: 0 0 0.5rem;
    transition: color 0.4s;
  }

  .light .tagline {
    color: #222;
  }

  .subtitle {
    font-size: 0.88rem;
    color: #555;
    margin: 0 0 1.5rem;
    line-height: 1.7;
    transition: color 0.4s;
  }

  .light .subtitle {
    color: #777;
  }

  .hue-strip {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: 1.5rem;
  }

  .hue-seg {
    width: 24px;
    height: 4px;
    border-radius: 2px;
  }

  /* Guide */
  .guide-section {
    margin-bottom: 2rem;
  }

  .guide-card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(12px);
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s,
      background 0.4s;
  }

  .guide-card:hover {
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.04);
  }

  .light .guide-card {
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  }

  .light .guide-card:hover {
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .guide-card-inner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.75rem;
  }

  @media (max-width: 480px) {
    .guide-card-inner {
      flex-direction: column;
      text-align: center;
    }
  }

  .guide-visual {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .guide-orb-ring {
    position: relative;
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ring-dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .ring-center {
    font-size: 0.65rem;
    font-weight: 700;
    color: #aaa;
    letter-spacing: 0.05em;
    transition: color 0.4s;
  }

  .light .ring-center {
    color: #999;
  }

  .guide-body {
    flex: 1;
  }

  .glass-tag {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    color: #e89c00;
    border: 1px solid #ffd93d55;
    border-radius: 20px;
    padding: 2px 8px;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
    background: #ffd93d11;
    transition:
      color 0.4s,
      border-color 0.4s,
      background 0.4s;
  }

  .light .glass-tag {
    color: #9a6700;
    border-color: #f59f0066;
    background: #fff3cd;
  }

  .guide-body h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: #f0f0f0;
    transition: color 0.4s;
  }

  .light .guide-body h2 {
    color: #1a1a1a;
  }

  .guide-body p {
    font-size: 0.85rem;
    color: #888;
    margin: 0 0 0.75rem;
    line-height: 1.6;
    transition: color 0.4s;
  }

  .light .guide-body p {
    color: #666;
  }

  .neon-cta {
    font-size: 0.85rem;
    font-weight: 700;
    background: linear-gradient(90deg, #ffd93d, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Tools */
  .tools-section {
    margin-bottom: 2rem;
  }

  .tools-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .tools-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
    transition: color 0.4s;
  }

  .light .tools-label {
    color: #aaa;
  }

  .tools-divider {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    transition: background 0.4s;
  }

  .light .tools-divider {
    background: rgba(0, 0, 0, 0.08);
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 540px) {
    .tools-grid {
      grid-template-columns: 1fr;
    }
  }

  .tool-glass {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    backdrop-filter: blur(8px);
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s,
      background 0.4s;
  }

  .tool-glass:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
  }

  .light .tool-glass {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.07);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  }

  .light .tool-glass:hover {
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  }

  .tool-gradient-bar {
    height: 3px;
  }

  .tool-glass-body {
    padding: 1.1rem;
  }

  .tool-glass-tag {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    border: 1px solid;
    border-radius: 20px;
    padding: 2px 7px;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
    background: transparent;
    transition: background 0.4s;
  }

  .light .tool-glass-tag {
    background: color-mix(in srgb, var(--glow) 8%, transparent);
  }

  .tool-glass-body h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: #f0f0f0;
    transition: color 0.4s;
  }

  .light .tool-glass-body h3 {
    color: #1a1a1a;
  }

  .tool-glass-body p {
    font-size: 0.78rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
    transition: color 0.4s;
  }

  .light .tool-glass-body p {
    color: #888;
  }

  /* Footer */
  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    text-align: center;
    transition: border-color 0.4s;
  }

  .light .page-footer {
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  .back-link {
    font-size: 0.85rem;
    color: #444;
    text-decoration: none;
    transition: color 0.4s;
  }

  .back-link:hover {
    color: #888;
  }

  .light .back-link {
    color: #bbb;
  }

  .light .back-link:hover {
    color: #777;
  }

  /* Light mode: page background */
  .light {
    background: #f5f0ff;
    color: #1a1a1a;
  }
</style>
