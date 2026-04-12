<script lang="ts">
  import favicon from "$lib/assets/favicon.ico"
  import icon from "$lib/assets/icon.svg"
  import appleTouchIcon from "$lib/assets/apple-touch-icon.png"
  import { page } from "$app/state"
  import { resolve } from "$app/paths"
  import SwitchLightDark from "$lib/components/SwitchLightDark.svelte"
  import "$lib/styles/color.css"

  let { children } = $props()

  const toolItems = [
    { href: resolve("/approximate"), path: "/approximate", label: "色の近似" },
    { href: resolve("/analyze"), path: "/analyze", label: "配色分析" },
    { href: resolve("/patterns"), path: "/patterns", label: "配色シミュレータ" }
  ]

  const contentItems = [
    { href: resolve("/color-theory"), path: "/color-theory", label: "色の理論" },
    { href: resolve("/color-fields"), path: "/color-fields", label: "色の活用分野" }
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
    href="https://fonts.googleapis.com/css2?family=Flow+Rounded&family=Rakkas&family=Delius&family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<header class="site-header">
  <div class="header-inner">
    <!-- 左：ハンバーガーボタン（ナロー専用）+ サイト名 -->
    <div class="header-left">
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
      <a href={resolve("/")} class="site-name" aria-label="PCCS Lens トップへ">
        <span class="site-name-pccs">PCCS</span>
        <span class="site-name-lens">Lens</span>
      </a>
    </div>

    <!-- 中央：ワイド画面用グローバルナビ（H — ドット + テキスト階層型） -->
    <nav class="wide-nav nav-h" aria-label="メインナビゲーション">
      <!-- ツールセクション -->
      <div class="h-section" style="--hc-gradient:linear-gradient(135deg,#ff6b6b,#ffd93d)">
        <div class="h-section-label">
          <span class="h-dot" style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"></span>
          <span>ツール</span>
        </div>
        <div class="h-links">
          {#each toolItems as item (item.href)}
            <a href={item.href} class="h-link" class:active={page.url.pathname.includes(item.path)}>
              {item.label}
            </a>
          {/each}
        </div>
      </div>

      <!-- コンテンツセクション -->
      <div class="h-section" style="--hc-gradient:linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)">
        <div class="h-section-label">
          <span
            class="h-dot"
            style="background:linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)"
          ></span>
          <span>コンテンツ</span>
        </div>
        <div class="h-links">
          {#each contentItems as item (item.href)}
            <a href={item.href} class="h-link" class:active={page.url.pathname.includes(item.path)}>
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>

    <!-- 右：モード切り替えボタン -->
    <div class="header-right">
      <SwitchLightDark />
    </div>
  </div>

  <!-- ナロー画面用ドロップダウンナビ（H — ドット + テキスト階層型 Narrow） -->
  {#if isNavOpen}
    <nav id="dropdown-nav" class="dropdown-nav" aria-label="メインナビゲーション">
      <div class="h-n-drawer">
        <!-- ツールセクション -->
        <p class="h-n-tree-sec">
          <span class="h-dot" style="background:linear-gradient(135deg,#ff6b6b,#ffd93d)"></span>
          ツール
        </p>
        <div
          class="h-n-tree-links"
          style="--hc:#ff6b6b; --hc-gradient:linear-gradient(135deg,#ff6b6b,#ffd93d)"
        >
          {#each toolItems as item (item.href)}
            <a
              href={item.href}
              class="h-n-tree-link"
              class:active={page.url.pathname.includes(item.path)}
              onclick={closeNav}
            >
              <span class="h-n-tree-dot" style="background:#ff6b6b"></span>
              {item.label}
            </a>
          {/each}
        </div>

        <!-- コンテンツセクション -->
        <p class="h-n-tree-sec">
          <span
            class="h-dot"
            style="background:linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)"
          ></span>
          コンテンツ
        </p>
        <div
          class="h-n-tree-links"
          style="--hc:#4d96ff; --hc-gradient:linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)"
        >
          {#each contentItems as item (item.href)}
            <a
              href={item.href}
              class="h-n-tree-link"
              class:active={page.url.pathname.includes(item.path)}
              onclick={closeNav}
            >
              <span class="h-n-tree-dot" style="background:#4d96ff"></span>
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>
  {/if}

  <!-- 色相ドリップバー -->
  <div class="header-drip-bar" aria-hidden="true">
    {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c, i (c)}
      <div class="hd-col" style="background:{c}">
        <div class="hd-drip" style="--dh:{14 + (i % 3) * 10}px; --dl:{((i * 41) % 65) + 18}%"></div>
      </div>
    {/each}
  </div>
</header>

<div class="container">{@render children()}</div>

<style>
  /* ===== グローバル ===== */
  :global(:root) {
    color-scheme: light dark;
  }

  :global(body) {
    --font-mono: "Reddit Mono", monospace;
    --font-fancy: "Delius", cursive;
    --font-classic: "Rakkas", serif;
    --font-anki-title: "Flow Rounded", system-ui;

    font-family: "SUSE Mono", "Zen Kaku Gothic Antique", sans-serif;
    font-synthesis-weight: none;
    margin: 0;

    background: var(--color-bg);
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

  /* ===== メインコンテンツラッパー ===== */
  .container {
    margin: 3rem auto 4rem;
    padding: 1.5rem 1.5rem 0;
  }

  /* ===== サイトヘッダー ===== */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(14px);
    background: light-dark(rgba(255, 255, 255, 0.85), rgba(12, 12, 20, 0.85));
    border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
    transition:
      background 0.4s,
      border-color 0.4s;
  }

  .header-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0.5rem 1.25rem;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4rem;
  }

  /* ===== ヘッダー左側 ===== */
  .header-left {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-shrink: 0;
  }

  /* ===== サイト名 ===== */
  .site-name {
    display: flex;
    gap: 0.35rem;
    text-decoration: none;
    line-height: 1;
    flex-shrink: 0;

    font-size: 1rem;
    font-weight: 900;
    letter-spacing: -0.03em;
  }

  .site-name-pccs {
    color: light-dark(#1a1a1a, #f0f0f0);
    transition: color 0.4s;
  }

  .site-name-lens {
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff, #ff6b6b);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ===== ワイド画面用ナビ（H — ドット + テキスト階層型） ===== */
  .wide-nav {
    display: none;
    justify-content: center;
  }

  @media (min-width: 640px) {
    .wide-nav {
      display: flex;
    }
  }

  /* nav-h: プロトタイプの .nav-h に対応（display は .wide-nav で制御） */
  .nav-h {
    align-items: flex-start;
    gap: 1.25rem;
    font-size: 0.82rem;
  }

  .h-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .h-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #828282);
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
    align-items: center;
    column-gap: 1rem;
    padding-inline-start: 16px;
  }

  .h-link {
    color: light-dark(#555, #bbb);
    text-decoration: none;
    padding-block: 4px;
    padding-inline: 0;
    font-size: 0.82rem;
    background-image: var(--hc-gradient);
    background-repeat: no-repeat;
    background-size: 0 1.5px;
    background-position: 0 100%;
    transition:
      color 0.15s,
      background-size 0.15s;
  }

  .h-link:hover,
  .h-link.active {
    background-size: 100% 1.5px;
  }

  /* ===== ヘッダー右側 ===== */
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    margin-inline-start: auto;
  }

  /* ===== G — スペクトラムバー ハンバーガーボタン ===== */
  .hamburger-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    padding: 0;
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
    padding: 0 1.25rem 0.5rem;
    border-top: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
  }

  @media (min-width: 640px) {
    .dropdown-nav {
      display: none;
    }
  }

  /* H — ドット + テキスト階層型 Narrow の中身 */
  .h-n-drawer {
    padding: 10px 10px 8px;
    font-size: 0.82rem;
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

  .h-n-tree-links {
    padding-inline-start: 10px;
  }

  .h-n-tree-link {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 6px;
    color: light-dark(#555, #bbb);
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    position: relative;
    transition: color 0.15s;
  }

  .h-n-tree-link::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--hc-gradient);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  .h-n-tree-link:hover,
  .h-n-tree-link.active {
    color: var(--hc);
  }

  .h-n-tree-link:hover::before,
  .h-n-tree-link.active::before {
    opacity: 0.1;
  }

  .h-n-tree-dot {
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
