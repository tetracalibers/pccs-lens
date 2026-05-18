<script lang="ts">
  import { page } from "$app/state"
  import { resolve } from "$app/paths"
  import Icon from "@iconify/svelte"
  import { colorTheoryPageNav } from "$lib/content-pages/color-theory"
  import { colorFieldsPageNav } from "$lib/content-pages/color-fields"

  const isConceptPage = $derived(page.route.id === "/concept")

  const pageNavInfo = $derived.by(() => {
    const id = page.route.id
    if (!id) return null
    for (const base of ["color-theory", "color-fields"] as const) {
      const prefix = `/${base}/`
      if (!id.startsWith(prefix)) continue
      const slug = id.slice(prefix.length)
      if (!slug || slug.includes("/")) continue
      const nav =
        base === "color-theory" ? colorTheoryPageNav.get(slug) : colorFieldsPageNav.get(slug)
      if (!nav) return null
      // @ts-expect-error dynamic route path
      const prevHref = nav.prev ? resolve(`/${base}/${nav.prev.slug}`) : undefined
      // @ts-expect-error dynamic route path
      const nextHref = nav.next ? resolve(`/${base}/${nav.next.slug}`) : undefined
      return { prev: nav.prev, next: nav.next, prevHref, nextHref }
    }
    return null
  })
</script>

<footer class="site-footer">
  {#if pageNavInfo}
    <nav class="footer-page-nav" aria-label="ページ送り">
      {#if pageNavInfo.prev && pageNavInfo.prevHref}
        <a class="footer-page-nav-link footer-page-nav-prev" href={pageNavInfo.prevHref}>
          <Icon icon="mingcute:arrow-left-line" aria-hidden="true" />
          <span class="footer-page-nav-title">{pageNavInfo.prev.title}</span>
        </a>
      {/if}
      {#if pageNavInfo.next && pageNavInfo.nextHref}
        <a class="footer-page-nav-link footer-page-nav-next" href={pageNavInfo.nextHref}>
          <span class="footer-page-nav-title">{pageNavInfo.next.title}</span>
          <Icon icon="mingcute:arrow-right-line" aria-hidden="true" />
        </a>
      {/if}
    </nav>
  {:else}
    <div class="footer-inner">
      <a href={isConceptPage ? resolve("/") : resolve("/concept")} class="footer-link">
        {isConceptPage ? "トップページへ" : "このサイトの歩き方"}
      </a>
    </div>
  {/if}
</footer>

<style>
  /* ===== サイトフッター ===== */
  .site-footer {
    margin-block-end: 1rem;
    margin-inline: 1rem;
    position: relative;
  }

  .site-footer::before {
    content: "";
    border-image-source: linear-gradient(
      to right,
      #dfe9f3 0%,
      rgba(255, 255, 255, 0.25) 50%,
      #dfe9f3 100%
    );
    border-image-slice: 1;
    border-block-start: 1px solid;
    position: absolute;
    inset: 0;
    z-index: -1;
  }

  :global(.dark) .site-footer::before {
    opacity: 0.4;
  }

  .footer-inner {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .footer-link {
    --_bg-opacity: 0.75;
    --_bg-dot-size: 4px;

    color: var(--color-body);
    text-decoration: none;
    font-size: 0.82rem;
    padding-block: 8px;
    background-image:
      radial-gradient(
        circle closest-side,
        rgba(199, 125, 255, var(--_bg-opacity)),
        rgba(77, 150, 255, var(--_bg-opacity)) 95%,
        transparent 100%
      ),
      linear-gradient(
        135deg,
        rgba(199, 125, 255, var(--_bg-opacity)),
        rgba(77, 150, 255, var(--_bg-opacity))
      );
    background-repeat: no-repeat;
    background-size:
      var(--_bg-dot-size) var(--_bg-dot-size),
      0 1.5px;
    background-position: 50% 100%;
    transition:
      color 0.15s,
      background-size 0.25s;
  }

  .footer-link:hover {
    background-size:
      0 0,
      100% 1.5px;
  }

  /* ===== prev / next ページ送り ===== */
  .footer-page-nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
    align-items: center;
    padding-block-start: 1.5rem;
    padding-block-end: 1rem;
    max-width: 680px;
    margin-inline: auto;
  }

  .footer-page-nav-link {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    column-gap: 0.5rem;
    color: var(--color-body);
    text-decoration: none;
    font-size: 0.8rem;
    line-height: 1.4;
    max-width: 100%;
  }

  .footer-page-nav-link:hover {
    color: light-dark(#4d96ff, #c77dff);
  }

  .footer-page-nav-prev {
    grid-column: 1;
    justify-self: start;
    text-align: start;
  }

  .footer-page-nav-next {
    grid-column: 2;
    justify-self: end;
    text-align: end;
  }

  .footer-page-nav-title {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
