<script lang="ts">
  import favicon from "$lib/assets/favicon.ico"
  import icon from "$lib/assets/icon.svg"
  import appleTouchIcon from "$lib/assets/apple-touch-icon.png"
  import { page } from "$app/state"
  import { resolve } from "$app/paths"
  import SwitchLightDark from "$lib/components/switch-light-dark.svelte"

  let { children } = $props()

  const navItems = [
    { href: resolve("/approximate"), path: "/approximate", label: "色の近似" },
    { href: resolve("/analyze"), path: "/analyze", label: "配色分析" },
    { href: resolve("/patterns"), path: "/patterns", label: "配色シミュレータ" }
  ]

  let isNavOpen = $state(false)

  function closeNav() {
    isNavOpen = false
  }
</script>

<svelte:head>
  <meta name="color-scheme" content="light dark" />
  <link rel="icon" href={favicon} />
  <link rel="icon" href={icon} type="image/svg+xml" />
  <link rel="apple-touch-icon" href={appleTouchIcon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<header class="site-header">
  <div class="header-inner">
    <!-- 左：サイト名 -->
    <a href={resolve("/")} class="site-name" aria-label="PCCS Lens トップへ">
      <span class="site-name-pccs">PCCS</span>
      <span class="site-name-lens">Lens</span>
    </a>

    <!-- 中央：ワイド画面用グローバルナビ（H — ドット + テキスト階層型） -->
    <nav class="wide-nav" aria-label="メインナビゲーション">
      <div class="h-section">
        <div class="h-section-label">
          <span class="h-dot" style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"></span>
          <span>ツール</span>
        </div>
        <div class="h-links">
          {#each navItems as item (item.href)}
            <a
              href={item.href}
              class="h-link"
              class:active={page.url.pathname.includes(item.path)}
              style="--hc:#ff6b6b"
            >
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>

    <!-- 右：モード切り替えボタン + ハンバーガーボタン（ナロー専用） -->
    <div class="header-right">
      <SwitchLightDark />
      <!-- G — スペクトラムバー ハンバーガーボタン -->
      <button
        class="hamburger-btn"
        onclick={() => (isNavOpen = true)}
        aria-label="メニューを開く"
        aria-expanded={isNavOpen}
        aria-controls="fullscreen-nav"
      >
        <span class="g-bar g1"></span>
        <span class="g-bar g2"></span>
        <span class="g-bar g3"></span>
      </button>
    </div>
  </div>

  <!-- 色相ドリップバー -->
  <div class="header-drip-bar" aria-hidden="true">
    {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c, i (c)}
      <div class="hd-col" style="background:{c}">
        <div class="hd-drip" style="--dh:{14 + (i % 3) * 10}px; --dl:{((i * 41) % 65) + 18}%"></div>
      </div>
    {/each}
  </div>
</header>

<!-- F — フルスクリーンオーバーレイ（ナロー画面ナビ） -->
<div
  id="fullscreen-nav"
  class="fullscreen-overlay"
  class:open={isNavOpen}
  role="dialog"
  aria-modal="true"
  aria-label="ナビゲーション"
>
  <div class="fso-header">
    <span class="site-name">
      <span class="site-name-pccs">PCCS</span>
      <span class="site-name-lens">Lens</span>
    </span>
    <button class="fso-close" onclick={closeNav} aria-label="メニューを閉じる">✕</button>
  </div>
  <nav class="fso-nav" aria-label="メインナビゲーション">
    <!-- H — ドット + テキスト階層型 Narrow の中身 -->
    <div class="h-n-drawer">
      <p class="h-n-tree-sec">
        <span class="h-dot" style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"></span>
        ツール
      </p>
      {#each navItems as item (item.href)}
        <a
          href={item.href}
          class="h-n-tree-link"
          class:active={page.url.pathname.includes(item.path)}
          style="--hc:#ff6b6b"
          onclick={closeNav}
        >
          <span class="h-n-tree-dot" style="background:#ff6b6b"></span>
          {item.label}
        </a>
      {/each}
    </div>
  </nav>
</div>

{@render children()}

<style>
  /* ===== グローバル ===== */
  :global(:root) {
    color-scheme: light dark;
  }

  :global(body) {
    --font-mono: "Reddit Mono", monospace;

    font-family: "SUSE Mono", "Zen Kaku Gothic Antique", sans-serif;
    font-synthesis-weight: none;
    margin: 0;

    background: light-dark(#ffffff, #0c0c14);
    color: light-dark(#1a1a1a, #f0f0f0);
    transition:
      background 0.4s,
      color 0.4s;
  }

  :global(body.light) {
    color-scheme: light;
  }

  :global(body.dark) {
    color-scheme: dark;
  }

  /* ===== サイトヘッダー ===== */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(14px);
    background: light-dark(rgba(255, 255, 255, 0.92), rgba(12, 12, 20, 0.92));
    border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
    transition:
      background 0.4s,
      border-color 0.4s;
  }

  .header-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  /* ===== サイト名 ===== */
  .site-name {
    display: flex;
    gap: 0.35rem;
    text-decoration: none;
    line-height: 1;
    flex-shrink: 0;
  }

  .site-name-pccs {
    font-size: 1rem;
    font-weight: 900;
    color: light-dark(#1a1a1a, #f0f0f0);
    letter-spacing: -0.03em;
    transition: color 0.4s;
  }

  .site-name-lens {
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: -0.03em;
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

  /* ===== ワイド画面用ナビ（H — ドット + テキスト階層型） ===== */
  .wide-nav {
    display: none;
    flex: 1;
    justify-content: center;
  }

  @media (min-width: 640px) {
    .wide-nav {
      display: flex;
    }
  }

  .h-section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    align-items: center;
  }

  .h-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #555);
    transition: color 0.4s;
  }

  .h-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .h-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    justify-content: center;
  }

  .h-link {
    color: light-dark(#555, #bbb);
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.82rem;
    transition:
      background 0.15s,
      color 0.15s,
      box-shadow 0.15s;
  }

  .h-link:hover,
  .h-link.active {
    background: color-mix(in srgb, var(--hc) 10%, transparent);
    color: var(--hc);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--hc) 25%, transparent);
  }

  /* ===== ヘッダー右側 ===== */
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* ===== G — スペクトラムバー ハンバーガーボタン ===== */
  .hamburger-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    padding: 0 11px;
    width: 44px;
    height: 44px;
    background: none;
    border: 0;
    cursor: pointer;
  }

  @media (min-width: 640px) {
    .hamburger-btn {
      display: none;
    }
  }

  .g-bar {
    display: block;
    height: 2.5px;
    border-radius: 2px;
    transition:
      width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s;
  }

  .g1 {
    width: 20px;
    background: #ff6b6b;
  }

  .g2 {
    width: 14px;
    background: #6bcb77;
  }

  .g3 {
    width: 17px;
    background: #4d96ff;
  }

  /* ===== 色相ドリップバー ===== */
  .header-drip-bar {
    display: flex;
    height: 5px;
    position: relative;
  }

  .hd-col {
    flex: 1;
    height: 5px;
    position: relative;
    opacity: 0.85;
  }

  .hd-drip {
    position: absolute;
    bottom: calc(-1 * var(--dh));
    left: var(--dl);
    width: 6px;
    height: calc(var(--dh) + 3px);
    background: inherit;
    border-radius: 0 0 4px 4px;
    opacity: 1;
  }

  /* ===== F — フルスクリーンオーバーレイ ===== */
  .fullscreen-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    background: light-dark(rgba(248, 248, 252, 0.98), rgba(8, 8, 16, 0.97));
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .fullscreen-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .fso-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    height: 56px;
    border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.07));
    flex-shrink: 0;
  }

  .fso-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
    background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
    color: light-dark(#666, #aaa);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .fso-close:hover {
    background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
    color: light-dark(#111, #fff);
  }

  .fso-nav {
    flex: 1;
    padding: 1.25rem;
    overflow-y: auto;
  }

  /* ===== H — ドット + テキスト階層型 Narrow の中身 ===== */
  .h-n-drawer {
    background: light-dark(#f8f8f8, #13132a);
    border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    padding: 10px 10px 8px;
  }

  .h-n-tree-sec {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #555);
    margin: 8px 0 4px;
  }

  .h-n-tree-link {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 8px;
    color: light-dark(#555, #bbb);
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.9rem;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .h-n-tree-link:hover,
  .h-n-tree-link.active {
    color: var(--hc);
    background: color-mix(in srgb, var(--hc) 8%, transparent);
  }

  .h-n-tree-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
