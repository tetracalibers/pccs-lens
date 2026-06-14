<script lang="ts">
  import { resolve } from "$app/paths"
  import GradeTag, { type Grade } from "$lib/components/m-directive/GradeTag.svelte"
  import StartHereTag from "$lib/components/site-top/StartHereTag.svelte"

  const hueOrbs = [
    { color: "#ff6b6b", x: 15, y: 20, size: 160 },
    { color: "#ffd93d", x: 75, y: 60, size: 100 },
    { color: "#6bcb77", x: 50, y: 85, size: 120 },
    { color: "#4d96ff", x: 85, y: 20, size: 80 },
    { color: "#c77dff", x: 35, y: 65, size: 90 }
  ]

  interface CardItem {
    href: string
    gradient: string
    glow: string
    title: string
    desc: string
    grades: Grade[]
    tags?: string[]
  }

  const contents: CardItem[] = [
    {
      href: resolve("/color-theory"),
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
      glow: "#ff6b6b",
      title: "色の理論",
      desc: "穴埋め問題集としても使える色彩学の解説",
      grades: ["3", "2", "1", "uc"]
    },
    {
      href: resolve("/color-fields"),
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)",
      glow: "#6bcb77",
      title: "色の活用分野",
      desc: "デザイン・ビジネス・ファッション・インテリア・景観色彩など",
      grades: ["3", "2", "1", "uc"]
    },
    {
      href: resolve("/jis-color-map"),
      gradient: "linear-gradient(135deg, #c77dff, #4d96ff)",
      glow: "#c77dff",
      title: "慣用色名マップ",
      desc: "慣用色を色相・明度の2軸で眺め、比較して覚える",
      grades: ["3", "2"]
    }
  ]

  const tools: CardItem[] = [
    {
      href: resolve("/approximate"),
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
      glow: "#ff6b6b",
      title: "色のPCCS近似",
      desc: "入力した色に近いPCCS値と慣用色名を調べる",
      grades: ["3", "2"]
    },
    {
      href: resolve("/analyze"),
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)",
      glow: "#6bcb77",
      title: "配色の分析",
      desc: "PCCSの色相・トーンに基づいて配色を分析する",
      grades: ["3", "2"]
    },
    {
      href: resolve("/patterns"),
      gradient: "linear-gradient(135deg, #c77dff, #4d96ff)",
      glow: "#c77dff",
      title: "配色シミュレータ",
      desc: "イメージに合う色の組み合わせを実験する",
      grades: ["2"]
    }
  ]

  const cgContents: CardItem[] = [
    {
      href: resolve("/cg"),
      gradient: "linear-gradient(135deg, #4d96ff, #c77dff)",
      glow: "#4d96ff",
      title: "コンピュータグラフィックス",
      desc: "デジタル画像や座標変換など、CGの基礎理論",
      grades: [],
      tags: ["CG Experts"]
    }
  ]
</script>

<svelte:head>
  <title>Color Prism</title>
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
      <div class="hero-eyebrow">HOW WE SEE COLOR</div>
      <h1>
        <span class="h1-pccs">Color</span>
        <span class="h1-lens">Prism</span>
      </h1>
      <p class="tagline">見て・触って学ぶ 色彩の暗記帳</p>
      <p class="subtitle">TOWARD NEW WAYS OF SEEING</p>
      <div class="hue-strip">
        {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c (c)}
          <div class="hue-seg" style="background:{c}"></div>
        {/each}
      </div>
    </header>

    <!-- Guide -->
    <section class="guide-section">
      <a href={resolve("/concept")} class="guide-card">
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
            </div>
          </div>
          <div class="guide-body">
            <div class="tool-glass-tags">
              <StartHereTag />
            </div>
            <h2>このサイトの歩き方</h2>
            <p>色のしくみを体験しながら学ぶ。このサイトでできる学びや体験を紹介します。</p>
          </div>
        </div>
      </a>
    </section>

    <!-- Contents -->
    <section class="contents-section">
      <div class="tools-header">
        <span class="tools-label">色彩コンテンツ</span>
        <div class="tools-divider"></div>
      </div>
      <div class="contents-grid">
        {#each contents as content (content.title)}
          <a href={content.href} class="tool-glass" style="--glow: {content.glow}">
            <div class="tool-gradient-bar" style="background: {content.gradient}"></div>
            <div class="tool-glass-body">
              {#if content.grades.length > 0}
                <div class="tool-glass-tags">
                  {#each content.grades as grade (grade)}
                    <GradeTag {grade} variant="light" />
                  {/each}
                </div>
              {/if}
              <h3>{content.title}</h3>
              <p>{content.desc}</p>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- Tools -->
    <section class="tools-section">
      <div class="tools-header">
        <span class="tools-label">色彩ツール</span>
        <div class="tools-divider"></div>
      </div>
      <div class="tools-grid">
        {#each tools as tool (tool.title)}
          <a href={tool.href} class="tool-glass" style="--glow: {tool.glow}">
            <div class="tool-gradient-bar" style="background: {tool.gradient}"></div>
            <div class="tool-glass-body">
              <div class="tool-glass-tags">
                {#each tool.grades as grade (grade)}
                  <GradeTag {grade} variant="light" />
                {/each}
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- CG / Image processing -->
    <section class="contents-section">
      <div class="tools-header">
        <span class="tools-label">CG・画像処理</span>
        <div class="tools-divider"></div>
      </div>
      <div class="contents-grid">
        {#each cgContents as content (content.title)}
          <a href={content.href} class="tool-glass" style="--glow: {content.glow}">
            <div class="tool-gradient-bar" style="background: {content.gradient}"></div>
            <div class="tool-glass-body">
              {#if content.grades.length > 0 || (content.tags?.length ?? 0) > 0}
                <div class="tool-glass-tags">
                  {#each content.grades as grade (grade)}
                    <GradeTag {grade} variant="light" />
                  {/each}
                  {#each content.tags ?? [] as tag (tag)}
                    <span class="card-tag">{tag}</span>
                  {/each}
                </div>
              {/if}
              <h3>{content.title}</h3>
              <p>{content.desc}</p>
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
    filter: blur(40px);
  }

  .orb {
    position: absolute;
    border-radius: 50%;
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
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    color: light-dark(lightslategray, gray);
    margin-bottom: 1rem;
  }

  .hero h1 {
    display: flex;
    justify-content: center;
    row-gap: 0.5rem;
    column-gap: 1rem;
    font-size: 3rem;
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
    color: var(--color-heading);
    margin: 0;
    margin-block-end: 1rem;
  }

  .subtitle {
    font-size: 0.8rem;
    margin: 0 0 1.5rem;
    line-height: 2;
    letter-spacing: 1px;
    color: light-dark(lightslategray, gray);
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
    box-shadow: 0 2px 16px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.02));
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .guide-card:hover {
    border-color: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.25));
    box-shadow: 0 4px 16px light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.04));
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

  .guide-body {
    flex: 1;
  }

  .guide-body h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--color-heading);
  }

  .guide-body p {
    font-size: 0.85rem;
    color: var(--color-body);
    margin: 0;
    line-height: 1.6;
  }

  /* Contents */
  .contents-section {
    margin-bottom: 2rem;
  }

  .contents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    .contents-grid {
      grid-template-columns: 1fr;
    }
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
    color: light-dark(#aaa, #7b7b7b);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }

  .tools-divider {
    flex: 1;
    height: 1px;
    background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.15));
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
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .tool-glass:hover {
    border-color: light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.2));
    box-shadow: 0 4px 12px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.2));
  }

  .tool-gradient-bar {
    height: 3px;
  }

  .tool-glass-body {
    padding: 1.1rem;
  }

  .tool-glass-tags {
    display: inline-flex;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .card-tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: var(--font-mono);
    line-height: 1.3;
    padding: 4px 8px;
    border-radius: 20px;
    white-space: nowrap;
    border: 1px solid var(--glow);
    color: oklch(from var(--glow) calc(l * 0.9) c h);
    background-color: oklch(from var(--glow) l c h / 10%);
  }

  .tool-glass-body h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: var(--color-heading);
  }

  .tool-glass-body p {
    font-size: 0.78rem;
    color: var(--color-body);
    margin: 0;
    line-height: 1.5;
  }
</style>
