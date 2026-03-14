<script lang="ts">
  import favicon from "$lib/assets/favicon.svg"
  import { page } from "$app/state"
  import { resolve } from "$app/paths"

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<header>
  <nav>
    <a href={resolve("/")} class="brand">PCCS Lens</a>
    <ul>
      <li>
        <a href={resolve("/approximate")} class:active={page.url.pathname.endsWith("/approximate")}>
          色の近似
        </a>
      </li>
      <li>
        <a href={resolve("/analyze")} class:active={page.url.pathname.endsWith("/analyze")}>
          配色分析
        </a>
      </li>
      <li>
        <a href={resolve("/patterns")} class:active={page.url.pathname.includes("/patterns")}>
          配色シミュレータ
        </a>
      </li>
    </ul>
  </nav>
</header>

{@render children()}

<style>
  :global(body) {
    --font-mono: "Reddit Mono", monospace;

    font-family: "SUSE Mono", "Zen Kaku Gothic Antique", sans-serif;
    font-synthesis-weight: none;

    margin-block: 0;
  }

  header {
    border-bottom: 1px solid var(--color-border, #ddd);
    background: var(--color-surface, #fff);
  }

  nav {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    justify-content: space-between;
  }

  .brand {
    font-weight: 700;
    font-size: 1.1rem;
    text-decoration: none;
    color: var(--color-text, #111);
    flex-shrink: 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    column-gap: 1rem;
    row-gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  ul a {
    text-decoration: none;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #555);
    padding: 0.25rem 0;
  }

  ul a:hover {
    color: var(--color-text, #111);
  }

  ul a.active {
    text-decoration: underline;
    text-decoration-style: solid;
    text-decoration-color: #1a1a1a;
    text-underline-offset: 0.3rem;
    color: var(--color-text, #111);
    font-weight: 600;
  }
</style>
