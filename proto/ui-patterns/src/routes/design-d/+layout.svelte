<script lang="ts">
  import { setContext } from "svelte"
  import { resolve } from "$app/paths"

  let { children } = $props()

  let isLight = $state(false)

  setContext("designD", {
    get isLight() {
      return isLight
    },
    toggle() {
      isLight = !isLight
    }
  })
</script>

<header class="site-header" class:light={isLight}>
  <div class="header-inner">
    <a href={resolve("/")} class="site-name" aria-label="PCCS Lens トップへ">
      <span class="site-name-pccs">PCCS</span>
      <span class="site-name-lens">Lens</span>
    </a>
    <nav class="site-nav" aria-label="メインナビゲーション">
      <button class="mode-toggle" onclick={() => (isLight = !isLight)}>
        {isLight ? "🌙 ダーク" : "☀️ ライト"}
      </button>
    </nav>
  </div>
  <!-- Hue drip bar at header bottom -->
  <div class="header-drip-bar" aria-hidden="true">
    {#each ["#e03131", "#f76707", "#f59f00", "#94d82d", "#2f9e44", "#0c8599", "#1971c2", "#3b5bdb", "#6741d9", "#9c36b5", "#c2255c", "#e84393"] as c, i (c)}
      <div class="hd-col" style="background:{c}">
        <div class="hd-drip" style="--dh:{14 + (i % 3) * 10}px; --dl:{((i * 41) % 65) + 18}%"></div>
      </div>
    {/each}
  </div>
</header>

{@render children()}

<style>
  :global(body) {
    margin: 0;
    background: #0c0c14;
  }
  :global(body:has(.light)) {
    background: #ffffff;
  }

  /* Site header */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(14px);
    transition: background 0.4s;
  }

  .header-inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .site-name {
    display: flex;
    gap: 0.4rem;
    text-decoration: none;
    line-height: 1;
  }

  .site-name-pccs {
    font-size: 1.05rem;
    font-weight: 900;
    color: #f0f0f0;
    letter-spacing: -0.03em;
    transition: color 0.4s;
  }

  .light .site-name-pccs {
    color: #1a1a1a;
  }

  .site-name-lens {
    font-size: 1.05rem;
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

  .site-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .mode-toggle {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  .mode-toggle:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #eee;
  }

  .light .mode-toggle {
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.04);
    color: #555;
  }

  .light .mode-toggle:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #222;
  }

  /* Header drip bar */
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
