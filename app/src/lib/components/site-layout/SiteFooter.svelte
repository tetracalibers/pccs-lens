<script lang="ts">
  import { page } from "$app/state"
  import { resolve } from "$app/paths"
  import Icon from "@iconify/svelte"
  import { colorTheoryPageNav } from "$lib/content-pages/color-theory-nav"
  import { colorFieldsPageNav } from "$lib/content-pages/color-fields-nav"
  import { cgPagesInCurriculumOrder, cgGroupIdByRoute } from "$lib/content-pages/cg"
  import { cgArticlePageNav } from "$lib/content-pages/cg-article-nav"

  const isConceptPage = $derived(page.route.id === "/concept")
  const isCgIndexPage = $derived(page.route.id === "/cg")

  const pageNavInfo = $derived.by(() => {
    const id = page.route.id
    if (!id) return null

    // CG ユニットページ（動的ルート /cg/[slug]）は cgGroups のカリキュラム順で前後に送る
    const cgIndex =
      id === "/cg/[slug]"
        ? cgPagesInCurriculumOrder.findIndex((cgPage) => cgPage.route === page.params.slug)
        : -1
    if (cgIndex !== -1) {
      const current = cgPagesInCurriculumOrder[cgIndex]
      const prev = cgPagesInCurriculumOrder[cgIndex - 1]
      const next = cgPagesInCurriculumOrder[cgIndex + 1]
      const groupId = cgGroupIdByRoute.get(current.route)
      return {
        prev: prev ? { title: prev.title } : undefined,
        next: next ? { title: next.title } : undefined,
        prevHref: prev?.href,
        nextHref: next?.href,
        listHref: groupId ? `${resolve("/cg")}#${groupId}` : resolve("/cg"),
        listLabel: "一覧へ戻る"
      }
    }

    // CG 記事ページ（静的ネストルート /cg/<unit>/<article>）は記事の読み順で前後に送る
    if (id.startsWith("/cg/") && id !== "/cg/[slug]") {
      const nav = cgArticlePageNav.get(id.slice(1))
      if (!nav) return null
      return {
        prev: nav.prev ? { title: nav.prev.title } : undefined,
        next: nav.next ? { title: nav.next.title } : undefined,
        prevHref: nav.prev?.href,
        nextHref: nav.next?.href,
        listHref: nav.listHref,
        listLabel: "一覧へ戻る"
      }
    }

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
      const listHref = `${resolve(`/${base}`)}#${nav.categoryId}`
      return {
        prev: nav.prev,
        next: nav.next,
        prevHref,
        nextHref,
        listHref,
        listLabel: "一覧へ戻る"
      }
    }
    return null
  })
</script>

<footer class="site-footer">
  {#if pageNavInfo}
    <nav class="footer-page-nav" aria-label="ページ送り">
      {#if pageNavInfo.prev && pageNavInfo.prevHref}
        <a class="footer-page-nav-link footer-page-nav-prev" href={pageNavInfo.prevHref}>
          <Icon icon="uil:arrow-left" width="16" aria-hidden="true" />
          <span class="footer-page-nav-title">{pageNavInfo.prev.title}</span>
        </a>
      {/if}
      {#if pageNavInfo.listHref}
        <a class="footer-link footer-page-nav-list" href={pageNavInfo.listHref}>
          {pageNavInfo.listLabel}
        </a>
      {/if}
      {#if pageNavInfo.next && pageNavInfo.nextHref}
        <a class="footer-page-nav-link footer-page-nav-next" href={pageNavInfo.nextHref}>
          <span class="footer-page-nav-title">{pageNavInfo.next.title}</span>
          <Icon icon="uil:arrow-right" width="16" aria-hidden="true" />
        </a>
      {/if}
    </nav>
  {:else}
    <div class="footer-inner">
      {#if isCgIndexPage}
        <a href={resolve("/")} class="footer-link">トップへ戻る</a>
      {:else}
        <a href={isConceptPage ? resolve("/") : resolve("/concept")} class="footer-link">
          {isConceptPage ? "トップページへ" : "このサイトの歩き方"}
        </a>
      {/if}
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
    grid-template-columns: minmax(0, 33cqw) 1fr minmax(0, 33cqw);
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
