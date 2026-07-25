<script lang="ts">
  import favicon from "$lib/assets/favicon.ico"
  import icon from "$lib/assets/icon.svg"
  import appleTouchIcon from "$lib/assets/apple-touch-icon.png"
  import { page } from "$app/state"
  import SiteHeader from "$lib/components/site-layout/SiteHeader.svelte"
  import SiteFooter from "$lib/components/site-layout/SiteFooter.svelte"
  import SiteMeta from "$lib/components/SiteMeta.svelte"
  import { mainWidthForRoute } from "$lib/styles/main-width"
  import { ankiMode } from "$lib/state/anki.svelte"
  import "$lib/styles/color.css"
  import "$lib/styles/layout.css"
  import "$lib/styles/shiki.css"

  let { children } = $props()

  const CONTENT_TOP_ROUTES = new Set(["/color-theory", "/color-fields"])
  const isContentPage = $derived(
    (page.route.id !== null &&
      !CONTENT_TOP_ROUTES.has(page.route.id) &&
      (page.route.id.startsWith("/color-theory") ||
        page.route.id.startsWith("/color-fields") ||
        (page.route.id.startsWith("/cg/") && page.route.id !== "/cg/[slug]") ||
        page.route.id === "/jis-color-map/[family]")) ||
      page.route.id === "/concept"
  )
  // ページ系統ごとの main 最大幅。分岐はこの1箇所（mainWidthForRoute）に集約し、
  // ラッパーの --main-width-current を main と SiteFooter が継承して参照する。
  const mainMaxWidth = $derived(mainWidthForRoute(page.route.id))

  $effect(() => {
    if (!isContentPage) ankiMode.reset()
  })
</script>

<svelte:head>
  <meta name="color-scheme" content="light dark" />
  <link rel="icon" href={favicon} />
  <link rel="icon" href={icon} type="image/svg+xml" />
  <link rel="apple-touch-icon" href={appleTouchIcon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Sigmar+One&family=Kiwi+Maru:wght@500&family=Flow+Circular&family=Flow+Rounded&family=Rakkas&family=Delius&family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap"
    rel="stylesheet"
  />
  <link href="https://fonts.googleapis.com/css2?family=Marmelad&display=swap" rel="stylesheet" />
</svelte:head>

<SiteMeta />

<!-- display: contents なので描画ボックスは作らず（レイアウト不変）、--main-width-current だけを
     子孫（main / SiteFooter）へ継承させる。 -->
<div class="page-shell" style="--main-width-current: {mainMaxWidth}">
  <SiteHeader {isContentPage} />

  <div class="container">{@render children()}</div>

  <SiteFooter />
</div>

<style>
  /* ===== グローバル ===== */
  :global(:root) {
    color-scheme: light dark;
  }

  :global(body) {
    --font-ja-base: "Zen Kaku Gothic New";
    --font-ja: var(--font-ja-base), sans-serif;
    --font-en-base: "SUSE Mono";
    --font-en: var(--font-en-base), sans-serif;
    --font-mono-base: "Reddit Mono";
    --font-mono: var(--font-mono-base), monospace;
    --font-fancy: "Delius", cursive;
    --font-classic: "Rakkas", serif;
    --font-anki-title: "Flow Rounded", system-ui;
    --font-anki-round: "Flow Circular", system-ui;
    --font-round: "Kiwi Maru", serif;
    --font-mark: var(--font-mono-base), var(--font-ja-base);
    --font-math-base: "Marmelad";
    --font-math: var(--font-math-base), sans-serif;
    --font-bold-text-demo: "Sigmar One", sans-serif;

    font-family: var(--font-en-base), var(--font-ja-base), sans-serif;
    font-synthesis-weight: none;
    -webkit-text-size-adjust: 100%;
    margin: 0;

    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;

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

  /* CSS 変数を子孫へ配るだけのラッパー。描画ボックスは作らない（既存レイアウトに影響しない）。 */
  .page-shell {
    display: contents;
  }

  /* ===== メインコンテンツラッパー ===== */
  .container {
    flex: 1 0 auto;
    width: 100%;
    box-sizing: border-box;
    /* 上は色相ドリップバーの垂れ短縮に合わせて詰める（下は従来どおり） */
    margin: 2.5rem auto 3rem;
    padding: 1.5rem 1.5rem 0;
    container-type: inline-size;
  }
</style>
