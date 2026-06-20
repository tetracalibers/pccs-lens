<script lang="ts">
  import LinkCard, {
    type CardTag,
    type LinkCardItem
  } from "$lib/components/site-top/LinkCard.svelte"
  import { cgPages, cgGroups, type CgPage, type CgLink } from "$lib/content-pages/cg"
  import { isPageLink } from "$lib/content-pages/types"
  import { guidePages } from "$lib/meta/guide-pages"
  import type { CgGroup } from "$lib/meta/group"
  import { SvelteSet, SvelteMap } from "svelte/reactivity"

  const cgTag: CardTag = { label: "CG", color: "var(--color-cg)" }
  const imgpTag: CardTag = { label: "画像処理", color: "var(--color-image-processing)" }

  // カードの配色パレット（cgPages の並び順で循環）
  const palette: { gradient: string; glow: string }[] = [
    { gradient: "linear-gradient(135deg, #4d96ff, #c77dff)", glow: "#4d96ff" },
    { gradient: "linear-gradient(135deg, #6bcb77, #4d96ff)", glow: "#6bcb77" },
    { gradient: "linear-gradient(135deg, #c77dff, #4d96ff)", glow: "#c77dff" },
    { gradient: "linear-gradient(135deg, #ff6b6b, #ffd93d)", glow: "#ff6b6b" },
    { gradient: "linear-gradient(135deg, #f59f00, #ffd93d)", glow: "#f59f00" },
    { gradient: "linear-gradient(135deg, #4dd0e1, #4d96ff)", glow: "#4dd0e1" }
  ]

  const hasGroup = (link: CgLink): link is Extract<CgLink, { group: CgGroup[] }> => "group" in link

  // ページ内のリンクが属する group から CG / 画像処理タグを導出する。
  // 下書きリンク（CgDraftLink）は YAML の group を、slug リンク（PageLink）は
  // 対応する .svx フロントマターの group を guidePages から解決する。
  const tagsOf = (page: CgPage): CardTag[] => {
    const groups = new SvelteSet<CgGroup>()
    for (const section of page.sections) {
      for (const link of section.links) {
        if (hasGroup(link)) {
          for (const g of link.group) groups.add(g)
        } else {
          const meta = guidePages.get(`cg/${page.route}/${link.slug}`)
          if (meta) for (const g of meta.group) groups.add(g)
        }
      }
    }
    const tags: CardTag[] = []
    if (groups.has("CG")) tags.push(cgTag)
    if (groups.has("ImgP")) tags.push(imgpTag)
    return tags
  }

  // ページ内の記事がすべて下書き（公開待ち）または未作成なら true（カードに Coming Soon を表示）
  const isComingSoon = (page: CgPage): boolean => {
    const links = page.sections.flatMap((section) => section.links)
    return (
      links.length > 0 &&
      links.every((link) => {
        if (!isPageLink(link)) return true // CgDraftLink = 未作成
        return guidePages.get(`cg/${page.route}/${link.slug}`)?.draft ?? true // 下書き or メタ未生成
      })
    )
  }

  // route 引きできるカード集合（配色は cgPages 全体での並び順で循環）
  const cardByRoute = new SvelteMap<string, LinkCardItem>(
    cgPages.map((page, i) => [
      page.route,
      {
        href: page.href,
        ...palette[i % palette.length],
        title: page.title,
        desc: page.summary,
        tags: tagsOf(page),
        comingSoon: isComingSoon(page)
      }
    ])
  )

  // 区分ごとにカードをまとめる（区分定義は cg.ts と共有）
  const cgGroupCards = cgGroups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.routes
      .map((route) => cardByRoute.get(route))
      .filter((card): card is LinkCardItem => card != null)
  }))
</script>

<svelte:head>
  <title>CG・画像処理 - Color Prism</title>
</svelte:head>

<main>
  <header class="cg-hero">
    <div class="cg-eyebrow">GRAPHICS & IMAGE</div>
    <h1>CG・画像処理</h1>
    <p>架空の景色を映すCGと、画像を扱う広い世界</p>
  </header>

  {#each cgGroupCards as group (group.id)}
    <section id={group.id} class="cg-group">
      <div class="cg-group-header">
        <span class="cg-group-label">{group.label}</span>
        <div class="cg-group-divider"></div>
      </div>
      <div class="contents-grid">
        {#each group.items as content (content.title)}
          <LinkCard {...content} />
        {/each}
      </div>
    </section>
  {/each}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
  }

  .cg-hero {
    text-align: center;
    padding: 0 0 2.5rem;
  }

  .cg-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: light-dark(#aaa, #7b7b7b);
    margin-bottom: 0.75rem;
  }

  .cg-hero h1 {
    font-size: 2.1rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    margin: 0 0 0.75rem;
    color: var(--color-heading);
  }

  .cg-hero p {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--color-body);
    margin: 0;
  }

  .cg-group {
    margin-bottom: 2.75rem;
    scroll-margin-top: 120px;
  }

  .cg-group-header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1.25rem;
  }

  .cg-group-label {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    line-height: 1.3;
    color: var(--color-heading);
    white-space: nowrap;
  }

  .contents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
</style>
