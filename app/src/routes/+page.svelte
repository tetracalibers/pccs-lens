<script lang="ts">
  import { resolve } from "$app/paths"
  import LinkCard, { type LinkCardItem } from "$lib/components/site-top/LinkCard.svelte"
  import StartHereTag from "$lib/components/site-top/StartHereTag.svelte"

  const hueOrbs = [
    { color: "#ff6b6b", x: 15, y: 20, size: 160 },
    { color: "#ffd93d", x: 75, y: 60, size: 100 },
    { color: "#6bcb77", x: 50, y: 85, size: 120 },
    { color: "#4d96ff", x: 85, y: 20, size: 80 },
    { color: "#c77dff", x: 35, y: 65, size: 90 }
  ]

  const contents: LinkCardItem[] = [
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

  const tools: LinkCardItem[] = [
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

  const games: LinkCardItem[] = [
    {
      href: resolve("/games/lightness-match"),
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
      glow: "#ff6b6b",
      title: "明度マッチング",
      desc: "明度が同じ色を探すカードゲーム",
      grades: ["3", "2"]
    },
    {
      href: resolve("/games/tone-hunt"),
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)",
      glow: "#6bcb77",
      title: "清色・濁色の見極め",
      desc: "PCCSの明清色・暗清色・中間色を見分けるカードゲーム",
      grades: ["3"]
    },
    {
      href: resolve("/games/tone-match"),
      gradient: "linear-gradient(135deg, #c77dff, #4d96ff)",
      glow: "#c77dff",
      title: "トーンの見極め",
      desc: "PCCSの個々のトーンを見分けるカードゲーム",
      grades: ["3"]
    }
  ]

  const cgContents: LinkCardItem[] = [
    {
      href: resolve("/cg"),
      gradient: "linear-gradient(135deg, #4d96ff, #c77dff)",
      glow: "#4d96ff",
      title: "色と画像（CGと画像処理）",
      desc: "光や色を計算して生み出す、CGと画像処理の世界",
      tags: [
        { label: "CG", color: "var(--color-cg)" },
        { label: "画像処理", color: "var(--color-image-processing)" }
      ]
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
        <span class="tools-label">色を学ぶ</span>
        <div class="tools-divider"></div>
      </div>
      <div class="contents-grid">
        {#each contents as content (content.title)}
          <LinkCard {...content} />
        {/each}
      </div>
    </section>

    <!-- Tools -->
    <section class="tools-section">
      <div class="tools-header">
        <span class="tools-label">色を使う</span>
        <div class="tools-divider"></div>
      </div>
      <div class="tools-grid">
        {#each tools as tool (tool.title)}
          <LinkCard {...tool} />
        {/each}
      </div>
    </section>

    <!-- Games -->
    <section class="tools-section">
      <div class="tools-header">
        <span class="tools-label">色を見分ける</span>
        <div class="tools-divider"></div>
      </div>
      <div class="tools-grid">
        {#each games as game (game.title)}
          <LinkCard {...game} />
        {/each}
      </div>
    </section>

    <!-- CG / Image processing -->
    <section id="cg" class="contents-section">
      <div class="tools-header">
        <span class="tools-label">色と関わる</span>
        <div class="tools-divider"></div>
      </div>
      <div class="contents-grid">
        {#each cgContents as content (content.title)}
          <LinkCard {...content} />
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
    background: rgba(255, 255, 255, 0.03);
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

  #cg {
    scroll-margin-top: 120px;
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
    color: var(--color-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }

  .tools-divider {
    flex: 1;
    height: 1px;
    background: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.25));
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

  /* Guide card のタグ枠（リンクカードは LinkCard.svelte 側で完結） */
  .tool-glass-tags {
    display: inline-flex;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }
</style>
