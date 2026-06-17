<script lang="ts">
  import { resolve } from "$app/paths"
  import LinkCard, {
    type CardTag,
    type LinkCardItem
  } from "$lib/components/site-top/LinkCard.svelte"
  import {
    cgAnimation,
    cgBasics,
    cgModeling,
    cgRendering,
    cgTransformation
  } from "$lib/content-pages/cg"

  const cgTag: CardTag = { label: "CG", color: "var(--color-cg)" }
  const imgpTag: CardTag = { label: "画像処理", color: "var(--color-image-processing)" }

  const cgContents: LinkCardItem[] = [
    {
      href: resolve("/cg-basics"),
      gradient: "linear-gradient(135deg, #4d96ff, #c77dff)",
      glow: "#4d96ff",
      title: cgBasics.title,
      desc: "デジタル画像の表現とデジタルカメラモデル",
      tags: [cgTag, imgpTag]
    },
    {
      href: resolve("/cg-transformation"),
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)",
      glow: "#6bcb77",
      title: cgTransformation.title,
      desc: "座標変換・投影・ビューイングパイプライン",
      tags: [cgTag]
    },
    {
      href: resolve("/cg-modeling"),
      gradient: "linear-gradient(135deg, #c77dff, #4d96ff)",
      glow: "#c77dff",
      title: cgModeling.title,
      desc: "形状モデル・曲線曲面・ポリゴンなどの形状表現",
      tags: [cgTag]
    },
    {
      href: resolve("/cg-rendering"),
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
      glow: "#ff6b6b",
      title: cgRendering.title,
      desc: "隠面消去・シェーディングなど写実的描画",
      tags: [cgTag]
    },
    {
      href: resolve("/cg-animation"),
      gradient: "linear-gradient(135deg, #f59f00, #ffd93d)",
      glow: "#f59f00",
      title: cgAnimation.title,
      desc: "仮現運動・アニメーション技法・カメラワーク",
      tags: [cgTag]
    }
  ]
</script>

<svelte:head>
  <title>CG・画像処理 - Color Prism</title>
</svelte:head>

<main>
  <header class="cg-hero">
    <div class="cg-eyebrow">GRAPHICS & IMAGE</div>
    <h1>CG・画像処理</h1>
    <p>架空の景色を映すCGと、画像を扱う広い世界</p>
  </header>

  <div class="contents-grid">
    {#each cgContents as content (content.title)}
      <LinkCard {...content} />
    {/each}
  </div>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
  }

  .cg-hero {
    text-align: center;
    padding: 0 0 2.5rem;
  }

  .cg-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #7b7b7b);
    margin-bottom: 0.75rem;
  }

  .cg-hero h1 {
    font-size: 2.1rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    margin: 0 0 0.75rem;
    color: var(--color-heading);
  }

  .cg-hero p {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--color-body);
    margin: 0;
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
</style>
