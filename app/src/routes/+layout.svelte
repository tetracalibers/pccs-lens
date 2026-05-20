<script lang="ts">
  import favicon from "$lib/assets/favicon.ico"
  import icon from "$lib/assets/icon.svg"
  import appleTouchIcon from "$lib/assets/apple-touch-icon.png"
  import { page } from "$app/state"
  import SiteHeader from "$lib/components/site-layout/SiteHeader.svelte"
  import SiteFooter from "$lib/components/site-layout/SiteFooter.svelte"
  import { ankiMode } from "$lib/state/anki.svelte"
  import "$lib/styles/color.css"

  let { children } = $props()

  const CONTENT_TOP_ROUTES = new Set(["/color-theory", "/color-fields"])
  const isContentPage = $derived(
    (page.route.id !== null &&
      !CONTENT_TOP_ROUTES.has(page.route.id) &&
      (page.route.id.startsWith("/color-theory") ||
        page.route.id.startsWith("/color-fields") ||
        page.route.id === "/jis-color-map/[family]")) ||
      page.route.id === "/concept"
  )
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
    href="https://fonts.googleapis.com/css2?family=Sigmar+One&family=Kiwi+Maru:wght@500&family=Flow+Circular&family=Flow+Rounded&family=Rakkas&family=Delius&family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;1,300&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789[]()≡,"
    rel="stylesheet"
  />
</svelte:head>

<SiteHeader {isContentPage} />

<div class="container">{@render children()}</div>

<SiteFooter />

<style>
  /* ===== グローバル ===== */
  :global(:root) {
    color-scheme: light dark;
  }

  :global(body) {
    --font-ja-base: "Zen Kaku Gothic Antique";
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
    --font-math-base: "DM Mono";
    --font-bold-text-demo: "Sigmar One", sans-serif;

    font-family: var(--font-en-base), var(--font-ja-base), sans-serif;
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
    margin: 3rem auto;
    padding: 1.5rem 1.5rem 0;
    container-type: inline-size;
  }
</style>
