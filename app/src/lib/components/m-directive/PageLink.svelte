<script lang="ts">
  import GradeTag from "./GradeTag.svelte"
  import GroupTag from "./GroupTag.svelte"
  import { resolve } from "$app/paths"
  import { guidePages } from "$lib/meta/guide-pages"
  import { gradeArray2CSV, sortGrades } from "$lib/meta/grade"
  import { groupColors } from "$lib/meta/group"
  import DraftPageTitle from "./DraftPageTitle.svelte"
  import CgDraftPageTitle from "./CgDraftPageTitle.svelte"
  import { isProduction } from "$lib/env"
  import DraftTag from "../DraftTag.svelte"
  import { page } from "$app/state"

  interface Props {
    slug: string
  }

  let { slug }: Props = $props()

  // 一覧ページ自身のパスを基準にする。色の理論/色の活用分野は `/color-theory/`、
  // CG はユニット込みの `/cg/basics/` などになり、その配下の個別ページを解決する。
  const basePath = $derived(page.url.pathname.replace(/^\/+|\/+$/g, ""))

  const meta = $derived.by(() => {
    const found = guidePages.get(`${basePath}/${slug}`)
    if (!found) throw new Error(`PageLink: No metadata found for slug "${basePath}/${slug}"`)
    return found
  })
  const grades = $derived(meta.grades)
  const group = $derived(meta.group)
  const { useful, title, draft } = $derived(meta)

  // group を持つページ（CGと画像処理）は grades の代わりに group タグで表す。
  const isGroupPage = $derived(group.length > 0)

  // @ts-expect-error
  let href = $derived(resolve(`/${basePath}/${slug}`))

  const gradeColors = {
    "3": "#c4b5fd",
    "2": "#6ee7b7",
    "1": "#fde68a",
    uc: "#93c5fd"
  }

  let accentColor = $derived.by(() => {
    if (isGroupPage) return groupColors[group[0]]
    if (grades.length > 0) return gradeColors[grades[0]]
    return "#94a3b8"
  })
  const gradesList = $derived(sortGrades(grades))
</script>

{#if draft && isProduction}
  {#if isGroupPage}
    <CgDraftPageTitle {title} {group} />
  {:else}
    <DraftPageTitle grades={gradeArray2CSV(grades)} {title} />
  {/if}
{:else}
  <a {href} class="page-link" style="--pl-accent: {accentColor}">
    <span class="pl-title">{title}</span>
    {#if grades.length > 0 || group.length > 0 || useful || draft}
      <span class="pl-grades">
        {#if draft}
          <DraftTag />
        {/if}
        {#each gradesList as grade (grade)}
          <GradeTag {grade} />
        {/each}
        {#each group as g (g)}
          <GroupTag group={g} />
        {/each}
        {#if useful}
          <GradeTag grade="useful" />
        {/if}
      </span>
    {/if}
  </a>
{/if}

<style>
  .page-link {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    text-decoration: none;
    color: inherit;
    position: relative;
    padding: 0.5rem 0 0.5rem 1.5rem;
    transition: color 0.2s;
    column-gap: 1rem;
    row-gap: 0.25rem;
  }

  .page-link::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 0.5rem;
    width: 10px;
    height: 10px;
    border-radius: 50% 50% 50% 0;
    transform: translateY(50%) rotate(225deg);
    background: linear-gradient(
      135deg,
      var(--pl-accent),
      oklch(from var(--pl-accent) calc(l - 0.1) c h)
    );
    transition:
      border-radius 0.5s ease,
      transform 0.3s,
      background 0.2s;
  }

  .page-link:hover {
    color: oklch(from var(--pl-accent) calc(l - 0.2) c h);
  }

  .page-link:hover::before {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: translateY(50%) scale(1.35) rotate(315deg);
    background: linear-gradient(
      135deg,
      oklch(from var(--pl-accent) calc(l - 0.08) c h),
      oklch(from var(--pl-accent) calc(l - 0.22) c h)
    );
  }

  .pl-title {
    min-width: 0;
    width: fit-content;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pl-grades {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-inline-start: auto;
  }
</style>
