<script lang="ts">
  import { page } from "$app/state"
  import { resolve } from "$app/paths"
  import SwitchLightDark from "$lib/components/SwitchLightDark.svelte"
  import AnkiModeToggle from "$lib/components/AnkiModeToggle.svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { isContentPage = false }: { isContentPage?: boolean } = $props()

  const toolItems = [
    {
      href: resolve("/approximate"),
      path: "/approximate",
      label: "色の近似",
      labelFull: "色の近似"
    },
    {
      href: resolve("/analyze"),
      path: "/analyze",
      label: "配色分析",
      labelFull: "配色の分析"
    },
    {
      href: resolve("/patterns"),
      path: "/patterns",
      label: "配色実験",
      labelFull: "配色シミュレータ"
    }
  ]
  const contentItems = [
    {
      href: resolve("/color-theory"),
      path: "/color-theory",
      label: "色の理論",
      labelFull: "色の理論"
    },
    {
      href: resolve("/color-fields"),
      path: "/color-fields",
      label: "色の活用",
      labelFull: "色の活用分野"
    },
    {
      href: resolve("/jis-color-map"),
      path: "/jis-color-map",
      label: "慣用色名",
      labelFull: "慣用色名マップ"
    }
  ]
  const gameItems = [
    {
      href: resolve("/games/lightness-match"),
      path: "/games/lightness-match",
      label: "明度マッチング",
      labelFull: "明度マッチング"
    },
    {
      href: resolve("/games/tone-hunt"),
      path: "/games/tone-hunt",
      label: "清色・濁色の見極め",
      labelFull: "清色・濁色の見極め"
    },
    {
      href: resolve("/games/tone-match"),
      path: "/games/tone-match",
      label: "トーンの見極め",
      labelFull: "トーンの見極め"
    }
  ]
  const extraItems = [
    {
      href: resolve("/cg"),
      path: "/cg",
      label: "CGと画像処理",
      labelFull: "CGと画像処理"
    }
  ]

  // C — セカンダリスクロールバー用: セクションを1本の横バーにまとめる
  const navSections = [
    {
      label: "ツール",
      accent: "#ff6b6b",
      gradient: "linear-gradient(135deg,#ff6b6b,#ffd93d)",
      items: toolItems
    },
    {
      label: "コンテンツ",
      accent: "#4d96ff",
      gradient: "linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)",
      items: contentItems
    },
    {
      label: "ゲーム",
      accent: "#c77dff",
      gradient: "linear-gradient(135deg,#c77dff,#4d96ff)",
      items: gameItems
    },
    {
      label: "その他",
      accent: "#f76707",
      gradient: "linear-gradient(135deg,#f76707,#f59f00)",
      items: extraItems
    }
  ]

  // ナロー画面（スマホ）用のハンバーガーメニュー開閉
  let isNavOpen = $state(false)
  function closeNav() {
    isNavOpen = false
  }
</script>

<header class="site-header">
  <!-- 上段：（スマホ）ハンバーガー + サイト名 + モード切り替えなどのアクション -->
  <div class="header-inner">
    <div class="header-left">
      <!-- G — スペクトラムバー ハンバーガーボタン（ナロー専用） -->
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
      <a href={resolve("/")} class="site-name" aria-label="Color Prism トップへ">
        <span class="site-name-pccs">Color</span>
        <span class="site-name-lens">Prism</span>
      </a>
    </div>

    <div class="header-right">
      {#if isContentPage}
        <AnkiModeToggle isAnki={ankiMode.isAnki} ontoggle={ankiMode.toggle} />
      {/if}
      <SwitchLightDark />
    </div>
  </div>

  <!-- 下段：C — セカンダリスクロールバー（ワイド画面用の主ナビ・横スクロール） -->
  <nav class="secondary-bar" aria-label="メインナビゲーション">
    <div class="secondary-bar-inner">
      {#each navSections as section, i (section.label)}
        {#if i > 0}
          <span class="sb-divider" aria-hidden="true"></span>
        {/if}
        <span class="sb-group-label">
          <span class="sb-dot" style="background:{section.gradient}"></span>
          {section.label}
        </span>
        {#each section.items as item (item.href)}
          <a
            href={item.href}
            class="sb-item"
            class:active={page.url.pathname.includes(item.path)}
            style="--sb-accent:{section.accent}; --sb-gradient:{section.gradient}"
          >
            {item.label}
          </a>
        {/each}
      {/each}
    </div>
  </nav>

  <!-- ナロー画面（スマホ）用ドロップダウンナビ（H — ドット + テキスト階層型 Narrow） -->
  {#if isNavOpen}
    <nav id="dropdown-nav" class="dropdown-nav" aria-label="メインナビゲーション">
      <div class="h-n-drawer">
        {#each navSections as section (section.label)}
          <p class="h-n-tree-sec">
            <span class="h-dot" style="background:{section.gradient}"></span>
            {section.label}
          </p>
          <div
            class="h-n-tree-links"
            style="--hc:{section.accent}; --hc-gradient:{section.gradient}"
          >
            {#each section.items as item (item.href)}
              <a
                href={item.href}
                class="h-n-tree-link"
                class:active={page.url.pathname.includes(item.path)}
                onclick={closeNav}
              >
                <span class="h-n-tree-dot" style="background:{section.accent}"></span>
                {item.labelFull}
              </a>
            {/each}
          </div>
        {/each}
      </div>
    </nav>
  {/if}

  <!-- 色相ドリップバー -->
  <div class="header-drip-bar" aria-hidden="true">
    {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c, i (c)}
      <div class="hd-col" style="background:{c}">
        <div
          class="hd-drip"
          style="--dh:{10.5 + (i % 3) * 7.5}px; --dl:{((i * 41) % 65) + 18}%"
        ></div>
      </div>
    {/each}
  </div>
</header>

<style>
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
    justify-content: space-between;
    gap: 1rem;
  }

  /* ===== ヘッダー左側 ===== */
  .header-left {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-shrink: 0;
  }

  /* ===== G — スペクトラムバー ハンバーガーボタン（ナロー専用） ===== */
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

  /* ===== ヘッダー右側 ===== */
  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  /* ===== C — セカンダリスクロールバー（ワイド画面専用） ===== */
  .secondary-bar {
    display: none;
    border-top: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
    transition: border-color 0.4s;
  }

  @media (min-width: 640px) {
    .secondary-bar {
      display: block;
    }
  }

  .secondary-bar-inner {
    max-width: 960px;
    margin: 0 auto;
    padding-inline: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    overflow-x: auto;
    /* スクロールバーは隠す（横スクロールはタッチ・トラックパッドで操作） */
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    /* スクロール末端の項目が途切れて「続きがある」ことを示すための右端フェード */
    scroll-padding-inline: 1.25rem;
  }

  .secondary-bar-inner::-webkit-scrollbar {
    display: none;
  }

  /* セクションラベル（ツール / コンテンツ） */
  .sb-group-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #828282);
    transition: color 0.4s;
    padding-inline-end: 0.15rem;
    user-select: none;
  }

  .sb-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  /* セクション間の区切り */
  .sb-divider {
    flex-shrink: 0;
    width: 1px;
    align-self: stretch;
    margin-block: 0.5rem;
    margin-inline: 0.4rem;
    background: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
  }

  /* 各ナビ項目（タブ的に横並び） */
  .sb-item {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    height: 40px;
    padding-inline: 0.55rem;
    color: light-dark(#555, #bbb);
    text-decoration: none;
    font-size: 0.82rem;
    white-space: nowrap;
    background-image: var(--sb-gradient);
    background-repeat: no-repeat;
    background-size: 0 2px;
    background-position: 50% 100%;
    transition:
      color 0.15s,
      background-size 0.15s;
  }

  .sb-item:hover {
    color: light-dark(#1a1a1a, #f0f0f0);
    background-size: 60% 2px;
  }

  .sb-item.active {
    color: light-dark(#1a1a1a, #f0f0f0);
    font-weight: 700;
    background-size: 100% 2px;
  }

  /* ===== ナロー画面（スマホ）用ドロップダウンナビ ===== */
  .dropdown-nav {
    padding: 0 1.25rem 0.5rem;
    border-top: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.06));
  }

  @media (min-width: 640px) {
    .dropdown-nav {
      display: none;
    }
  }

  .h-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
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
    color: light-dark(#aaa, #7b7b7b);
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
