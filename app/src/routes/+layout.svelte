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
            >{item.label}</a>
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
        class:open={isNavOpen}
        onclick={() => (isNavOpen = !isNavOpen)}
        aria-label={isNavOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isNavOpen}
        aria-controls="dropdown-nav"
      >
        <span class="g-bar g1"></span>
        <span class="g-bar g2"></span>
        <span class="g-bar g3"></span>
      </button>
    </div>
  </div>

  <!-- ナロー画面用ドロップダウンナビ（A パターン：ヘッダー内展開） -->
  {#if isNavOpen}
    <nav id="dropdown-nav" class="dropdown-nav" aria-label="メインナビゲーション">
      {#each navItems as item (item.href)}
        <a
          href={item.href}
          class="dropdown-link"
          class:active={page.url.pathname.includes(item.path)}
          style="--hc:#ff6b6b"
          onclick={closeNav}
        >
          <span class="dropdown-dot" style="background:#ff6b6b"></span>
          {item.label}
        </a>
      {/each}
    </nav>
  {/if}

  <!-- 色相ドリップバー -->
  <div class="header-drip-bar" aria-hidden="true">
    {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c, i (c)}
      <div class="hd-col" style="background:{c}">
        <div class="hd-drip" style="--dh:{14 + (i % 3) * 10}px; --dl:{((i * 41) % 65) + 18}%">
        </div>
      </div>
    {/each}
  </div>
</header>

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

  .hamburger-btn.open .g1 {
    width: 20px;
    transform: translateY(7.5px) rotate(45deg);
    transform-origin: center center;
  }

  .hamburger-btn.open .g2 {
    opacity: 0;
    width: 0;
  }

  .hamburger-btn.open .g3 {
    width: 20px;
    transform: translateY(-7.5px) rotate(-45deg);
    transform-origin: center center;
  }

  /* ===== ナロー画面用ドロップダウンナビ ===== */
  .dropdown-nav {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    border-top: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
    animation: slide-down 0.2s ease;
  }

  @media (min-width: 640px) {
    .dropdown-nav {
      display: none;
    }
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-link {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1.25rem;
    font-size: 0.9rem;
    color: light-dark(#555, #ccc);
    text-decoration: none;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .dropdown-link:hover,
  .dropdown-link.active {
    background: color-mix(in srgb, var(--hc) 8%, transparent);
    color: var(--hc);
  }

  .dropdown-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
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
</style>
