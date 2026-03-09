<script lang="ts">
  import favicon from "$lib/assets/favicon.svg"
  import { page } from "$app/state"

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header>
  <nav>
    <a href="/" class="brand">PCCS Lens</a>
    <ul>
      <li>
        <a href="/approximate" class:active={(page.url.pathname as string) === "/approximate"}
          >色の近似</a
        >
      </li>
      <li>
        <a href="/analyze" class:active={(page.url.pathname as string) === "/analyze"}>配色分析</a>
      </li>
    </ul>
  </nav>
</header>

{@render children()}

<style>
  header {
    border-bottom: 1px solid var(--color-border, #ddd);
    background: var(--color-surface, #fff);
  }

  nav {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    height: 3rem;
  }

  .brand {
    font-weight: 700;
    font-size: 1.1rem;
    text-decoration: none;
    color: var(--color-text, #111);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1rem;
  }

  ul a {
    text-decoration: none;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #555);
    padding: 0.25rem 0;
    border-bottom: 2px solid transparent;
  }

  ul a:hover {
    color: var(--color-text, #111);
  }

  ul a.active {
    color: var(--color-text, #111);
    border-bottom-color: var(--color-primary, #1a1a1a);
    font-weight: 600;
  }
</style>
