<script lang="ts">
  import { getContext } from "svelte"
  import Icon from "@iconify/svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  // ナビゲーション項目（実際のサイト想定）
  const navItems = [
    { label: "ホーム", icon: "ph:house" },
    { label: "色相環", icon: "ph:circle-half-tilt" },
    { label: "配色ツール", icon: "ph:palette" },
    { label: "ガイド", icon: "ph:book-open" },
    { label: "コンポーネント", icon: "ph:squares-four" },
    { label: "設定", icon: "ph:gear" }
  ]

  const moreNavItems = [
    { label: "ホーム", icon: "ph:house" },
    { label: "色相環", icon: "ph:circle-half-tilt" },
    { label: "配色ツール", icon: "ph:palette" },
    { label: "ガイド", icon: "ph:book-open" },
    { label: "コンポーネント", icon: "ph:squares-four" },
    { label: "カラーDB", icon: "ph:database" },
    { label: "比較", icon: "ph:intersect" },
    { label: "設定", icon: "ph:gear" }
  ]

  // A: ハンバーガーメニュー
  let aOpen = $state(false)

  // B: ドロワー
  let bOpen = $state(false)

  // C: セカンダリバー（スクロール型）

  // D: ボトムシート
  let dOpen = $state(false)

  // E: タブバー（モバイル固定フッター）

  // F: フルスクリーンオーバーレイ
  let fOpen = $state(false)

  // G: コマンドパレット
  let gOpen = $state(false)
  let gQuery = $state("")

  // H: ポップオーバーメガメニュー
  let hOpen = $state(false)

  $effect(() => {
    document.body.style.background = theme.isLight ? "#ffffff" : "#0c0c14"
    document.body.style.color = theme.isLight ? "#1a1a1a" : "#d8d8e8"
    return () => {
      document.body.style.background = ""
      document.body.style.color = ""
    }
  })
</script>

<svelte:head>
  <title>ヘッダー - 案D</title>
</svelte:head>

<div class="page" class:light={theme.isLight}>
  <main>
    <header class="page-header">
      <p class="eyebrow">Design D / Components</p>
      <h1>ヘッダー</h1>
      <p class="subtitle">ナビゲーション・レイアウトのバリエーション（8案）</p>
    </header>

    <div class="patterns">
      <!-- ===== A: ハンバーガーメニュー ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">A</span>
          <div>
            <h2>ハンバーガーメニュー</h2>
            <p class="pattern-note">
              モバイルでは≡ボタン1つにナビを格納。デスクトップではインライン展開。最もシンプルな実装で馴染みやすく、項目が増えても対応可能。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">モバイル想定</div>
          <header class="hdr hdr-a" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <button
                  class="icon-btn"
                  onclick={() => theme.toggle()}
                  title="モード切替"
                  aria-label="モード切替"
                >
                  <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
                </button>
                <button
                  class="hamburger"
                  class:active={aOpen}
                  onclick={() => (aOpen = !aOpen)}
                  aria-label="メニュー"
                  aria-expanded={aOpen}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>
            {#if aOpen}
              <nav class="hdr-a-menu" aria-label="メインナビゲーション">
                {#each navItems as item}
                  <!-- svelte-ignore a11y_invalid_attribute -->
                  <a href="#" class="hdr-a-item" onclick={() => (aOpen = false)}>
                    <Icon icon={item.icon} width={16} />
                    {item.label}
                  </a>
                {/each}
              </nav>
            {/if}
          </header>
          <div class="demo-body">
            <div class="demo-placeholder">≡ を押してメニューを開く</div>
          </div>
        </div>

        <!-- Desktop variant -->
        <div class="demo-frame">
          <div class="device-label">デスクトップ想定（幅広）</div>
          <header class="hdr hdr-a hdr-a-desktop" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <nav class="hdr-a-inline" aria-label="メインナビゲーション">
                {#each navItems as item}
                  <!-- svelte-ignore a11y_invalid_attribute -->
                  <a href="#" class="hdr-a-inline-item">
                    {item.label}
                  </a>
                {/each}
              </nav>
              <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
              </button>
            </div>
          </header>
          <div class="demo-body">
            <div class="demo-placeholder">デスクトップではナビをインライン表示</div>
          </div>
        </div>
      </section>

      <!-- ===== B: ドロワーナビ ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">B</span>
          <div>
            <h2>サイドドロワー</h2>
            <p class="pattern-note">
              左からスライドインするドロワー。オーバーレイ付きで他コンテンツと分離。項目数が多くなっても縦スクロールで対応可能。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">モバイル想定</div>
          <header class="hdr hdr-b" class:light={theme.isLight}>
            <div class="hdr-inner">
              <button class="icon-btn" onclick={() => (bOpen = !bOpen)} aria-label="メニューを開く">
                <Icon icon="ph:list" width={18} />
              </button>
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <button
                class="icon-btn"
                onclick={() => theme.toggle()}
                title="モード切替"
                aria-label="モード切替"
              >
                <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
              </button>
            </div>
          </header>
          <!-- Drawer overlay -->
          {#if bOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="drawer-overlay" onclick={() => (bOpen = false)}></div>
          {/if}
          <nav
            class="drawer"
            class:open={bOpen}
            class:light={theme.isLight}
            aria-label="サイドナビゲーション"
          >
            <div class="drawer-header">
              <span class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </span>
              <button class="icon-btn" onclick={() => (bOpen = false)} aria-label="閉じる">
                <Icon icon="ph:x" width={16} />
              </button>
            </div>
            {#each moreNavItems as item}
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="drawer-item" onclick={() => (bOpen = false)}>
                <Icon icon={item.icon} width={16} />
                {item.label}
              </a>
            {/each}
          </nav>
          <div class="demo-body">
            <div class="demo-placeholder">☰ を押してドロワーを開く</div>
          </div>
        </div>
      </section>

      <!-- ===== C: セカンダリスクロールバー ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">C</span>
          <div>
            <h2>セカンダリスクロールバー</h2>
            <p class="pattern-note">
              上段にロゴ・アクション、下段にナビをスクロール可能な横バーで配置。項目増加に強く、JSなしで実装可能。タブバー的な直感操作。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">モバイル・デスクトップ両対応</div>
          <header class="hdr hdr-c" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
              </button>
            </div>
            <nav class="hdr-c-scroll" aria-label="メインナビゲーション">
              {#each moreNavItems as item}
                <!-- svelte-ignore a11y_invalid_attribute -->
                <a href="#" class="hdr-c-item">
                  <Icon icon={item.icon} width={14} />
                  {item.label}
                </a>
              {/each}
            </nav>
          </header>
          <div class="demo-body">
            <div class="demo-placeholder">下段バーを横スクロール →</div>
          </div>
        </div>
      </section>

      <!-- ===== D: ボトムシートナビ ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">D</span>
          <div>
            <h2>ボトムシートナビ</h2>
            <p class="pattern-note">
              「もっと見る」タップで画面下からシートが展開。親指が届きやすいモバイルUXを重視。重要なリンクをアイコン付きグリッドで一覧表示。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">モバイル想定</div>
          <header class="hdr hdr-d" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <div style="display:flex;gap:0.25rem">
                <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                  <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
                </button>
                <button
                  class="icon-btn"
                  onclick={() => (dOpen = !dOpen)}
                  aria-label="ナビゲーションを開く"
                >
                  <Icon icon="ph:dots-nine" width={18} />
                </button>
              </div>
            </div>
          </header>
          <!-- Bottom sheet -->
          {#if dOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="sheet-overlay" onclick={() => (dOpen = false)}></div>
          {/if}
          <div class="bottom-sheet" class:open={dOpen} class:light={theme.isLight}>
            <div class="sheet-handle"></div>
            <div class="sheet-grid">
              {#each moreNavItems as item}
                <!-- svelte-ignore a11y_invalid_attribute -->
                <a href="#" class="sheet-item" onclick={() => (dOpen = false)}>
                  <span class="sheet-icon"><Icon icon={item.icon} width={22} /></span>
                  <span class="sheet-label">{item.label}</span>
                </a>
              {/each}
            </div>
          </div>
          <div class="demo-body">
            <div class="demo-placeholder">⠿ を押してボトムシートを開く</div>
          </div>
        </div>
      </section>

      <!-- ===== E: 固定タブバー（フッター）===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">E</span>
          <div>
            <h2>固定タブバー（フッター型）</h2>
            <p class="pattern-note">
              主要ページをフッターに固定配置。親指圏内で完結するモバイル最優先設計。アクティブ状態が視覚的に明確で、画面上部はコンテンツに専念。
            </p>
          </div>
        </div>
        <div class="demo-frame" style="position:relative;overflow:hidden">
          <div class="device-label">モバイル想定</div>
          <header class="hdr hdr-e" class:light={theme.isLight}>
            <div class="hdr-inner" style="justify-content:space-between">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
              </button>
            </div>
          </header>
          <div class="demo-body" style="padding-bottom:60px">
            <div class="demo-placeholder">フッタータブバーでナビゲーション</div>
          </div>
          <!-- Tab bar at bottom -->
          <nav class="tab-bar" class:light={theme.isLight} aria-label="タブナビゲーション">
            {#each navItems.slice(0, 5) as item, i}
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="tab-item" class:active={i === 0}>
                <Icon icon={item.icon} width={20} />
                <span>{item.label}</span>
              </a>
            {/each}
          </nav>
        </div>
      </section>

      <!-- ===== F: フルスクリーンオーバーレイ ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">F</span>
          <div>
            <h2>フルスクリーンオーバーレイ</h2>
            <p class="pattern-note">
              開くと全画面を覆うナビ。大きなタップターゲット・グラデーション背景でブランド感を演出。遷移先を明確に提示できる没入型メニュー。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">モバイル想定</div>
          <header class="hdr hdr-f" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <div style="display:flex;gap:0.25rem;align-items:center">
                <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                  <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
                </button>
                <button
                  class="menu-open-btn"
                  onclick={() => (fOpen = true)}
                  aria-label="メニューを開く"
                >
                  <Icon icon="ph:list" width={18} />
                  MENU
                </button>
              </div>
            </div>
          </header>
          <!-- Fullscreen overlay -->
          <div
            class="fullscreen-overlay"
            class:open={fOpen}
            class:light={theme.isLight}
            role="dialog"
            aria-modal="true"
            aria-label="ナビゲーション"
          >
            <div class="fso-header">
              <span class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </span>
              <button
                class="fso-close"
                onclick={() => (fOpen = false)}
                aria-label="メニューを閉じる"
              >
                <Icon icon="ph:x" width={20} />
              </button>
            </div>
            <nav class="fso-nav">
              {#each moreNavItems as item, i}
                <!-- svelte-ignore a11y_invalid_attribute -->
                <a
                  href="#"
                  class="fso-item"
                  style="animation-delay: {i * 0.04}s"
                  onclick={() => (fOpen = false)}
                >
                  <Icon icon={item.icon} width={20} />
                  {item.label}
                </a>
              {/each}
            </nav>
          </div>
          <div class="demo-body">
            <div class="demo-placeholder">MENU を押して全画面メニューを開く</div>
          </div>
        </div>
      </section>

      <!-- ===== G: コマンドパレット ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">G</span>
          <div>
            <h2>コマンドパレット</h2>
            <p class="pattern-note">
              検索窓を兼ねたコマンドパレット。キーボード操作に慣れたパワーユーザー向け。入力でフィルタリングでき、項目が大量でも迷子にならない。
            </p>
          </div>
        </div>
        <div class="demo-frame">
          <div class="device-label">デスクトップ重視・モバイル対応</div>
          <header class="hdr hdr-g" class:light={theme.isLight}>
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <button
                class="search-trigger"
                onclick={() => {
                  gOpen = true
                  gQuery = ""
                }}
                class:light={theme.isLight}
              >
                <Icon icon="ph:magnifying-glass" width={14} />
                <span>移動・検索...</span>
                <kbd>⌘K</kbd>
              </button>
              <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
              </button>
            </div>
          </header>
          <!-- Command palette modal -->
          {#if gOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="cp-backdrop" onclick={() => (gOpen = false)}></div>
            <div
              class="command-palette"
              class:light={theme.isLight}
              role="dialog"
              aria-label="コマンドパレット"
            >
              <div class="cp-search">
                <Icon icon="ph:magnifying-glass" width={16} />
                <input
                  type="text"
                  placeholder="ページを検索..."
                  bind:value={gQuery}
                  aria-label="ページ検索"
                />
              </div>
              <div class="cp-results">
                {#each moreNavItems.filter((i) => i.label.includes(gQuery)) as item}
                  <!-- svelte-ignore a11y_invalid_attribute -->
                  <a href="#" class="cp-item" onclick={() => (gOpen = false)}>
                    <Icon icon={item.icon} width={16} />
                    {item.label}
                  </a>
                {/each}
              </div>
            </div>
          {/if}
          <div class="demo-body">
            <div class="demo-placeholder">検索バーを押してコマンドパレットを開く</div>
          </div>
        </div>
      </section>

      <!-- ===== H: ポップオーバーメガメニュー ===== -->
      <section class="pattern-section">
        <div class="pattern-meta">
          <span class="pattern-id">H</span>
          <div>
            <h2>ポップオーバーメガメニュー</h2>
            <p class="pattern-note">
              「メニュー」ボタン下にグリッド型のポップオーバーを展開。アイコン・説明付きで目的地を一覧。デスクトップではホバー連動も可能な設計。
            </p>
          </div>
        </div>
        <div class="demo-frame" style="overflow:visible">
          <div class="device-label">デスクトップ・タブレット向け</div>
          <header
            class="hdr hdr-h"
            class:light={theme.isLight}
            style="position:relative;z-index:200"
          >
            <div class="hdr-inner">
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="logo">
                <span class="logo-pccs">PCCS</span>
                <span class="logo-lens">Lens</span>
              </a>
              <div style="display:flex;align-items:center;gap:0.5rem;position:relative">
                <button
                  class="mega-trigger"
                  class:active={hOpen}
                  class:light={theme.isLight}
                  onclick={() => (hOpen = !hOpen)}
                  aria-haspopup="true"
                  aria-expanded={hOpen}
                >
                  すべてのページ
                  <Icon icon={hOpen ? "ph:caret-up" : "ph:caret-down"} width={12} />
                </button>
                <button class="icon-btn" onclick={() => theme.toggle()} aria-label="モード切替">
                  <Icon icon={theme.isLight ? "ph:moon" : "ph:sun"} width={16} />
                </button>
                <!-- Popover -->
                {#if hOpen}
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div class="mega-backdrop" onclick={() => (hOpen = false)}></div>
                  <div class="mega-menu" class:light={theme.isLight}>
                    {#each moreNavItems as item}
                      <!-- svelte-ignore a11y_invalid_attribute -->
                      <a href="#" class="mega-item" onclick={() => (hOpen = false)}>
                        <span class="mega-icon"><Icon icon={item.icon} width={18} /></span>
                        <span>{item.label}</span>
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </header>
          <div class="demo-body" style="min-height:180px">
            <div class="demo-placeholder">「すべてのページ」を押してメガメニューを開く</div>
          </div>
        </div>
      </section>
    </div>
    <!-- /patterns -->

    <footer class="page-footer">
      <a href="/" class="back-link">← コンポーネント一覧に戻る</a>
    </footer>
  </main>
</div>

<style>
  /* ============================
     Page layout
  ============================ */
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
    max-width: 760px;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
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

  /* ============================
     Pattern sections
  ============================ */
  .patterns {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .pattern-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pattern-meta {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .pattern-id {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #c77dff, #4d96ff);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 900;
    color: #fff;
    margin-top: 2px;
  }

  .pattern-section h2 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: #f0f0f0;
    transition: color 0.4s;
  }
  .light .pattern-section h2 {
    color: #1a1a1a;
  }

  .pattern-note {
    font-size: 0.82rem;
    color: #666;
    margin: 0;
    line-height: 1.6;
    transition: color 0.4s;
  }
  .light .pattern-note {
    color: #888;
  }

  /* ============================
     Demo frame
  ============================ */
  .demo-frame {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }
  .light .demo-frame {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }

  .device-label {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #444;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition:
      color 0.4s,
      background 0.4s,
      border-color 0.4s;
  }
  .light .device-label {
    color: #aaa;
    background: rgba(0, 0, 0, 0.03);
    border-bottom-color: rgba(0, 0, 0, 0.06);
  }

  .demo-body {
    padding: 1.5rem;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .demo-placeholder {
    font-size: 0.78rem;
    color: #444;
    transition: color 0.4s;
  }
  .light .demo-placeholder {
    color: #bbb;
  }

  /* ============================
     Shared header primitives
  ============================ */
  .hdr {
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition:
      background 0.4s,
      border-color 0.4s;
  }
  .hdr.light {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .hdr-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 48px;
    gap: 0.75rem;
  }

  .logo {
    display: flex;
    gap: 0.35rem;
    text-decoration: none;
    line-height: 1;
    flex-shrink: 0;
  }

  .logo-pccs {
    font-size: 1rem;
    font-weight: 900;
    color: #f0f0f0;
    letter-spacing: -0.03em;
    transition: color 0.4s;
  }
  .light .logo-pccs {
    color: #1a1a1a;
  }

  .logo-lens {
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

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
  }
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #eee;
  }
  .light .icon-btn {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.04);
    color: #666;
  }
  .light .icon-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #222;
  }

  /* ============================
     A: ハンバーガー
  ============================ */
  .hdr-a {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-a.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 32px;
    height: 32px;
    padding: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s;
  }
  .hamburger span {
    display: block;
    height: 1.5px;
    background: #aaa;
    border-radius: 1px;
    transition:
      transform 0.25s,
      opacity 0.25s;
    transform-origin: center;
  }
  .hamburger.active span:nth-child(1) {
    transform: translateY(5.5px) rotate(45deg);
  }
  .hamburger.active span:nth-child(2) {
    opacity: 0;
  }
  .hamburger.active span:nth-child(3) {
    transform: translateY(-5.5px) rotate(-45deg);
  }
  .light .hamburger {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.04);
  }
  .light .hamburger span {
    background: #666;
  }

  .hdr-a-menu {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    animation: slide-down 0.2s ease;
  }
  .hdr-a.light .hdr-a-menu {
    border-top-color: rgba(0, 0, 0, 0.07);
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

  .hdr-a-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 1rem;
    font-size: 0.85rem;
    color: #ccc;
    text-decoration: none;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .hdr-a-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }
  .hdr-a.light .hdr-a-item {
    color: #555;
  }
  .hdr-a.light .hdr-a-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }

  /* A desktop: inline nav */
  .hdr-a-inline {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    flex: 1;
    justify-content: center;
  }

  .hdr-a-inline-item {
    padding: 5px 12px;
    font-size: 0.82rem;
    color: #aaa;
    text-decoration: none;
    border-radius: 6px;
    transition:
      background 0.15s,
      color 0.15s;
    white-space: nowrap;
  }
  .hdr-a-inline-item:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #eee;
  }
  .hdr-a-desktop.light .hdr-a-inline-item {
    color: #666;
  }
  .hdr-a-desktop.light .hdr-a-inline-item:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111;
  }

  /* ============================
     B: ドロワー
  ============================ */
  .hdr-b {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-b.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .drawer-overlay,
  .sheet-overlay,
  .cp-backdrop,
  .mega-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 150;
  }

  .drawer {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 220px;
    background: #13131f;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .drawer.open {
    transform: translateX(0);
  }
  .drawer.light {
    background: #f8f8fb;
    border-right-color: rgba(0, 0, 0, 0.08);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 48px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }
  .drawer.light .drawer-header {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .drawer-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    color: #ccc;
    text-decoration: none;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .drawer-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }
  .drawer.light .drawer-item {
    color: #555;
  }
  .drawer.light .drawer-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }

  /* ============================
     C: セカンダリスクロールバー
  ============================ */
  .hdr-c {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-c.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .hdr-c-scroll {
    display: flex;
    overflow-x: auto;
    gap: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    scrollbar-width: none;
  }
  .hdr-c-scroll::-webkit-scrollbar {
    display: none;
  }
  .hdr-c.light .hdr-c-scroll {
    border-top-color: rgba(0, 0, 0, 0.07);
  }

  .hdr-c-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 1rem;
    height: 34px;
    font-size: 0.78rem;
    white-space: nowrap;
    color: #888;
    text-decoration: none;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .hdr-c-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #eee;
  }
  .hdr-c.light .hdr-c-item {
    color: #888;
    border-right-color: rgba(0, 0, 0, 0.06);
  }
  .hdr-c.light .hdr-c-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #222;
  }

  /* ============================
     D: ボトムシート
  ============================ */
  .hdr-d {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-d.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .bottom-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1a1a2e;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px 16px 0 0;
    z-index: 200;
    transform: translateY(100%);
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0 1rem 1rem;
  }
  .bottom-sheet.open {
    transform: translateY(0);
  }
  .bottom-sheet.light {
    background: #f5f5f8;
    border-top-color: rgba(0, 0, 0, 0.09);
  }

  .sheet-handle {
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    margin: 10px auto 14px;
  }
  .bottom-sheet.light .sheet-handle {
    background: rgba(0, 0, 0, 0.12);
  }

  .sheet-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .sheet-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    border-radius: 10px;
    text-decoration: none;
    color: #ccc;
    background: rgba(255, 255, 255, 0.04);
    transition:
      background 0.2s,
      color 0.2s;
  }
  .sheet-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .bottom-sheet.light .sheet-item {
    color: #555;
    background: rgba(0, 0, 0, 0.04);
  }
  .bottom-sheet.light .sheet-item:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #111;
  }

  .sheet-icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  .sheet-label {
    font-size: 0.62rem;
    text-align: center;
  }

  /* ============================
     E: タブバー
  ============================ */
  .hdr-e {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-e.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .tab-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    display: flex;
    background: rgba(18, 18, 30, 0.96);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
  }
  .tab-bar.light {
    background: rgba(248, 248, 252, 0.96);
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: #555;
    font-size: 0.6rem;
    transition: color 0.2s;
  }
  .tab-item:hover {
    color: #aaa;
  }
  .tab-item.active {
    color: #c77dff;
  }
  .tab-bar.light .tab-item {
    color: #bbb;
  }
  .tab-bar.light .tab-item:hover {
    color: #888;
  }
  .tab-bar.light .tab-item.active {
    color: #6741d9;
  }

  /* ============================
     F: フルスクリーンオーバーレイ
  ============================ */
  .hdr-f {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-f.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .menu-open-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 5px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: #ccc;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .menu-open-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  .hdr-f.light .menu-open-btn {
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.04);
    color: #555;
  }
  .hdr-f.light .menu-open-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #111;
  }

  .fullscreen-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 16, 0.97);
    z-index: 300;
    display: flex;
    flex-direction: column;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .fullscreen-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }
  .fullscreen-overlay.light {
    background: rgba(248, 248, 252, 0.98);
  }

  .fso-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 48px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  .fullscreen-overlay.light .fso-header {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .fso-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .fso-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .fullscreen-overlay.light .fso-close {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.04);
    color: #666;
  }

  .fso-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0;
    overflow-y: auto;
  }

  .fso-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: #ccc;
    text-decoration: none;
    transition:
      background 0.15s,
      color 0.15s;
    animation: fso-in 0.3s ease both;
  }

  @keyframes fso-in {
    from {
      opacity: 0;
      transform: translateX(-16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .fso-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
  .fullscreen-overlay.light .fso-item {
    color: #444;
  }
  .fullscreen-overlay.light .fso-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }

  /* ============================
     G: コマンドパレット
  ============================ */
  .hdr-g {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-g.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .search-trigger {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: #666;
    font-size: 0.78rem;
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
    min-width: 0;
    max-width: 240px;
  }
  .search-trigger span {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .search-trigger:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: #aaa;
  }
  .search-trigger.light {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.03);
    color: #aaa;
  }
  .search-trigger.light:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.15);
    color: #666;
  }

  kbd {
    font-size: 0.65rem;
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    color: #555;
    white-space: nowrap;
    font-family: monospace;
    flex-shrink: 0;
  }
  .search-trigger.light kbd {
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.05);
    color: #aaa;
  }

  .command-palette {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(340px, 90%);
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    z-index: 200;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    animation: cp-in 0.18s ease;
  }
  .command-palette.light {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  }

  @keyframes cp-in {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-50% - 12px));
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .cp-search {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    color: #888;
  }
  .command-palette.light .cp-search {
    border-bottom-color: rgba(0, 0, 0, 0.07);
    color: #aaa;
  }

  .cp-search input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.88rem;
    color: #f0f0f0;
    font-family: inherit;
  }
  .command-palette.light .cp-search input {
    color: #1a1a1a;
  }

  .cp-results {
    padding: 0.5rem 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .cp-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 1rem;
    font-size: 0.85rem;
    color: #ccc;
    text-decoration: none;
    transition:
      background 0.12s,
      color 0.12s;
  }
  .cp-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }
  .command-palette.light .cp-item {
    color: #555;
  }
  .command-palette.light .cp-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }

  /* ============================
     H: メガメニュー
  ============================ */
  .hdr-h {
    background: rgba(12, 12, 20, 0.92);
  }
  .hdr-h.light {
    background: rgba(255, 255, 255, 0.92);
  }

  .mega-trigger {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 5px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #ccc;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
  }
  .mega-trigger:hover,
  .mega-trigger.active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
  .mega-trigger.light {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.04);
    color: #555;
  }
  .mega-trigger.active.light {
    background: rgba(0, 0, 0, 0.07);
    border-color: rgba(0, 0, 0, 0.15);
    color: #111;
  }

  .mega-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    z-index: 201;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
    padding: 0.5rem;
    min-width: 260px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
    animation: mega-in 0.18s ease;
  }
  .mega-menu.light {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.09);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
  }

  @keyframes mega-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mega-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
    color: #ccc;
    text-decoration: none;
    border-radius: 8px;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .mega-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .mega-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: rgba(199, 125, 255, 0.12);
    color: #c77dff;
    flex-shrink: 0;
  }

  .mega-menu.light .mega-item {
    color: #555;
  }
  .mega-menu.light .mega-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }
  .mega-menu.light .mega-icon {
    background: rgba(103, 65, 217, 0.08);
    color: #6741d9;
  }

  /* ============================
     Page footer
  ============================ */
  .page-footer {
    margin-top: 4rem;
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
    transition: color 0.2s;
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
