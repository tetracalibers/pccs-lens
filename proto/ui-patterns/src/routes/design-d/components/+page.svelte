<script lang="ts">
  import { resolve } from "$app/paths"
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  const components = [
    {
      href: resolve("/design-d/components/heading"),
      title: "見出し",
      desc: "セクション見出しのスタイルパターン",
      glow: "#ff6b6b",
      gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)"
    },
    {
      href: resolve("/design-d/components/mark"),
      title: "マーク",
      desc: "テキスト内のハイライト・マークアップ表現",
      glow: "#ffd93d",
      gradient: "linear-gradient(135deg, #ffd93d, #6bcb77)"
    },
    {
      href: resolve("/design-d/components/tips"),
      title: "Tips",
      desc: "補足情報や注意書きを示すコールアウト",
      glow: "#6bcb77",
      gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)"
    },
    {
      href: resolve("/design-d/components/term-card"),
      title: "用語カード",
      desc: "専門用語の定義や説明を表示するカード",
      glow: "#c77dff",
      gradient: "linear-gradient(135deg, #4d96ff, #c77dff)"
    },
    {
      href: resolve("/design-d/components/ulist"),
      title: "リスト",
      desc: "ulリストのバレットスタイルパターン",
      glow: "#67e8f9",
      gradient: "linear-gradient(135deg, #c77dff, #67e8f9)"
    },
    {
      href: resolve("/design-d/components/switch-light-dark"),
      title: "ライト/ダーク切替",
      desc: "ダークモードとライトモードを切り替えるボタンのスタイルパターン",
      glow: "#fbbf24",
      gradient: "linear-gradient(135deg, #67e8f9, #fbbf24)"
    },
    {
      href: resolve("/design-d/components/header"),
      title: "ヘッダー",
      desc: "ナビゲーションのレイアウトパターン（モバイル・デスクトップ対応）",
      glow: "#a78bfa",
      gradient: "linear-gradient(135deg, #fbbf24, #a78bfa)"
    }
  ]
</script>

<svelte:head>
  <title>コンポーネント一覧 - 案D</title>
</svelte:head>

<div class="page" class:light={theme.isLight}>
  <main>
    <header class="page-header">
      <p class="eyebrow">Design D</p>
      <h1>コンポーネント</h1>
      <p class="subtitle">UIパーツのスタイルパターン一覧</p>
    </header>

    <div class="grid">
      {#each components as item (item.title)}
        <a href={item.href} class="card" style="--glow: {item.glow}">
          <div class="card-bar" style="background: {item.gradient}"></div>
          <div class="card-body">
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <span class="cta" style="color: {item.glow}">見る →</span>
          </div>
        </a>
      {/each}
    </div>

    <footer class="page-footer">
      <a href={resolve("/design-d")} class="back-link">← デザインDトップに戻る</a>
    </footer>
  </main>
</div>

<style>
  .page {
    min-height: 100vh;
    background: #0c0c14;
    color: #f0f0f0;
    transition:
      background 0.4s,
      color 0.4s;
  }

  .light {
    background: #ffffff;
    color: #1a1a1a;
  }

  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
  }

  .page-header {
    margin-bottom: 2.5rem;
  }

  .eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #555;
    margin: 0 0 0.5rem;
    transition: color 0.4s;
  }

  .light .eyebrow {
    color: #999;
  }

  h1 {
    font-size: 2rem;
    font-weight: 900;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.88rem;
    color: #666;
    margin: 0;
    transition: color 0.4s;
  }

  .light .subtitle {
    color: #888;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
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

  .card:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 6px 24px color-mix(in srgb, var(--glow) 20%, transparent);
  }

  .light .card {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.07);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  }

  .light .card:hover {
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  }

  .card-bar {
    height: 3px;
  }

  .card-body {
    padding: 1.25rem;
  }

  .card-body h2 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: #f0f0f0;
    transition: color 0.4s;
  }

  .light .card-body h2 {
    color: #1a1a1a;
  }

  .card-body p {
    font-size: 0.82rem;
    color: #666;
    margin: 0 0 0.75rem;
    line-height: 1.5;
    transition: color 0.4s;
  }

  .light .card-body p {
    color: #888;
  }

  .cta {
    font-size: 0.8rem;
    font-weight: 700;
  }

  .page-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
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
</style>
