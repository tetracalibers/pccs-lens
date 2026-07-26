<script lang="ts">
  import { page } from "$app/state"
  import Icon from "@iconify/svelte"
  import { footerPageNavFor, footerSoloLinkFor, SITE_GUIDE_LABEL } from "$lib/meta/footer-page-nav"

  const pageNav = $derived(footerPageNavFor(page.route.id, page.params))
  const soloLink = $derived(footerSoloLinkFor(page.route.id))
</script>

<!-- 「このサイトの歩き方」だけは折り返し位置を <wbr /> で指定する。 -->
<!-- prettier-ignore -->
{#snippet linkLabel(label: string)}{#if label === SITE_GUIDE_LABEL}このサイトの<wbr />歩き方{:else}{label}{/if}{/snippet}

<footer class="site-footer">
  {#if pageNav}
    <nav class="footer-page-nav" aria-label="ページ送り">
      {#if pageNav.prev}
        <a class="footer-page-nav-link footer-page-nav-prev" href={pageNav.prev.href}>
          <Icon icon="uil:arrow-left" width="16" aria-hidden="true" />
          <span class="footer-page-nav-title">{pageNav.prev.title}</span>
        </a>
      {/if}
      <a class="footer-link footer-page-nav-list" href={pageNav.list.href}>
        {@render linkLabel(pageNav.list.label)}
      </a>
      {#if pageNav.next}
        <a class="footer-page-nav-link footer-page-nav-next" href={pageNav.next.href}>
          <span class="footer-page-nav-title">{pageNav.next.title}</span>
          <Icon icon="uil:arrow-right" width="16" aria-hidden="true" />
        </a>
      {/if}
    </nav>
  {:else}
    <div class="footer-inner">
      <a class="footer-link" href={soloLink.href}>{@render linkLabel(soloLink.title)}</a>
    </div>
  {/if}
</footer>

<style>
  /* ===== サイトフッター ===== */
  .site-footer {
    margin-block-end: 0.5rem;
    margin-inline: 1rem;
    position: relative;
    container-type: inline-size;
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
    grid-template-columns: minmax(0, 33%) 1fr minmax(0, 33%);
    column-gap: 1.5rem;
    align-items: center;
    padding-block-start: 1.5rem;
    padding-block-end: 1rem;
    /* 幅は現在ページの main に合わせる（--main-width-current）。ただし下限 680px・上限 870px。 */
    max-width: clamp(680px, var(--main-width-current), 870px);
    margin-inline: auto;
  }

  @media (width <= 870px) {
    .footer-page-nav {
      max-width: none;
    }
  }

  .footer-page-nav-link {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    column-gap: 0.25rem;
    color: var(--color-body);
    text-decoration: none;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .footer-page-nav-link:hover {
    color: light-dark(#4d96ff, #c77dff);
  }

  .footer-page-nav-prev {
    grid-column: 1;
    justify-self: start;
    text-align: start;
  }

  .footer-page-nav-list {
    grid-column: 2;
    justify-self: center;
    padding-block-start: 0;
    white-space: nowrap;
    text-align: center;
  }

  .footer-page-nav-next {
    grid-column: 3;
    justify-self: end;
    text-align: end;
  }

  .footer-page-nav-title {
    min-width: 0;
    word-break: auto-phrase;
    line-height: 1.5;
  }
</style>
