<script lang="ts">
  import { resolve } from "$app/paths"

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
  <title>PCCS Lens</title>
</svelte:head>

<div class="page">
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

  <main>
    <!-- Hero -->
    <header class="hero">
      <div class="hero-eyebrow">Color Theory System</div>
      <h1>
        <span class="h1-pccs">PCCS</span>
        <span class="h1-lens">Lens</span>
      </h1>
      <p class="tagline">色をPCCSというレンズを通して見る</p>
      <p class="subtitle">トーンのしくみから、配色の理論を直感的に学ぼう</p>
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
              {#each ["#f59f00", "#2f9e44", "#1971c2", "#6741d9", "#c2255c", "#e03131"] as c, i (c)}
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
            <p>色相とトーンで体系化された、色のイメージを反映できる色の表し方。まずはここから。</p>
            <span class="neon-cta">学習を始める</span>
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
  </main>
</div>

<style>
  .page {
    position: relative;
    overflow: hidden;
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
  }

  :global(.light) .orb {
    opacity: 0.18;
  }

  /* Main */
  main {
    position: relative;
    z-index: 1;
    max-width: 720px;
    margin: 0 auto;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 0 0 3rem;
  }

  .hero-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: light-dark(#999, #555);
    margin-bottom: 1rem;
  }

  .hero h1 {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    font-size: 4rem;
    font-weight: 900;
    margin: 0 0 1rem;
    letter-spacing: -0.03em;
    line-height: 0.95;
  }

  .h1-pccs {
    display: block;
    color: light-dark(#1a1a1a, #f0f0f0);
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
    color: light-dark(#222, #ddd);
    margin: 0 0 0.5rem;
  }

  .subtitle {
    font-size: 0.88rem;
    color: light-dark(#777, #7b7b7b);
    margin: 0 0 1.5rem;
    line-height: 1.7;
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
    background: light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.04));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
    box-shadow: light-dark(0 2px 16px rgba(0, 0, 0, 0.06), none);
    backdrop-filter: blur(12px);
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
  }

  .guide-card:hover {
    transform: translateY(-2px);
  }

  @media (prefers-color-scheme: dark) {
    .guide-card:hover {
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 32px rgba(255, 255, 255, 0.04);
    }
  }

  @media (prefers-color-scheme: light) {
    .guide-card:hover {
      border-color: rgba(0, 0, 0, 0.15);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
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
    color: light-dark(#999, #aaa);
    letter-spacing: 0.05em;
  }

  .guide-body {
    flex: 1;
  }

  .glass-tag {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    color: light-dark(#9a6700, #e89c00);
    border: 1px solid light-dark(#f59f0066, #ffd93d55);
    border-radius: 20px;
    padding: 2px 8px;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
    background: light-dark(#fff3cd, #ffd93d11);
  }

  .guide-body h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: light-dark(#1a1a1a, #f0f0f0);
  }

  .guide-body p {
    font-size: 0.85rem;
    color: light-dark(#666, #888);
    margin: 0 0 0.75rem;
    line-height: 1.6;
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
  .tools-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .tools-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: light-dark(#aaa, #444);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }

  .tools-divider {
    flex: 1;
    height: 1px;
    background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
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
    background: light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.04));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
    box-shadow: light-dark(0 1px 8px rgba(0, 0, 0, 0.05), none);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    backdrop-filter: blur(8px);
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
  }

  .tool-glass:hover {
    transform: translateY(-3px);
  }

  @media (prefers-color-scheme: dark) {
    .tool-glass:hover {
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
    }
  }

  @media (prefers-color-scheme: light) {
    .tool-glass:hover {
      border-color: rgba(0, 0, 0, 0.12);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    }
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
  }

  @media (prefers-color-scheme: light) {
    .tool-glass-tag {
      background: color-mix(in srgb, var(--glow) 8%, transparent);
    }
  }

  .tool-glass-body h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: light-dark(#1a1a1a, #f0f0f0);
  }

  .tool-glass-body p {
    font-size: 0.78rem;
    color: light-dark(#888, #666);
    margin: 0;
    line-height: 1.5;
  }
</style>
