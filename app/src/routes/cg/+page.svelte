<script lang="ts">
  import LinkCard, {
    type CardTag,
    type LinkCardItem
  } from "$lib/components/site-top/LinkCard.svelte"
  import { cgPages, type CgPage, type CgLink } from "$lib/content-pages/cg"
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

  // ページ内のリンクが属する group から CG / 画像処理タグを導出する
  const tagsOf = (page: CgPage): CardTag[] => {
    const groups = new SvelteSet<CgGroup>()
    for (const section of page.sections) {
      for (const link of section.links) {
        if (hasGroup(link)) for (const g of link.group) groups.add(g)
      }
    }
    const tags: CardTag[] = []
    if (groups.has("CG")) tags.push(cgTag)
    if (groups.has("ImgP")) tags.push(imgpTag)
    return tags
  }

  // 区分ごとのグルーピング（cgPages の並び順に対応）
  const groupDefs: { label: string; routes: string[] }[] = [
    {
      label: "基礎",
      routes: ["cg-basics", "cg-image-properties", "cg-camera", "cg-transformation"]
    },
    { label: "CG合成", routes: ["cg-modeling", "cg-rendering", "cg-animation"] },
    {
      label: "基本的な画像処理",
      routes: [
        "cg-rasterization",
        "cg-tone-conversion",
        "cg-spatial-filtering",
        "cg-frequency",
        "cg-binary-image",
        "cg-restoration",
        "cg-editing"
      ]
    },
    { label: "表現と可視化", routes: ["cg-npr"] },
    {
      label: "画像処理の応用と解析",
      routes: [
        "cg-segmentation",
        "cg-feature-detection",
        "cg-pattern-recognition",
        "cg-deep-learning",
        "cg-video",
        "cg-3d-reconstruction",
        "cg-optical-analysis"
      ]
    },
    { label: "符号化とシステム", routes: ["cg-image-coding", "cg-systems"] },
    { label: "知っておきたい関連知識", routes: ["cg-perception", "cg-ip-rights", "cg-history"] }
  ]

  // route 引きできるカード集合（配色は cgPages 全体での並び順で循環）
  const cardByRoute = new SvelteMap<string, LinkCardItem>(
    cgPages.map((page, i) => [
      page.route,
      {
        href: page.href,
        ...palette[i % palette.length],
        title: page.title,
        desc: page.summary,
        tags: tagsOf(page)
      }
    ])
  )

  const cgGroups = groupDefs.map((group) => ({
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

  {#each cgGroups as group (group.label)}
    <section class="cg-group">
      <div class="tools-header">
        <span class="tools-label">{group.label}</span>
        <div class="tools-divider"></div>
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
    margin-bottom: 2rem;
  }

  .tools-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .tools-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: light-dark(#aaa, #7b7b7b);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }

  .tools-divider {
    flex: 1;
    height: 1px;
    background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.15));
  }

  .contents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    .contents-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
