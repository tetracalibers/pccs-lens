<script lang="ts">
  import GradeTag from "./GradeTag.svelte"
  import { resolve } from "$app/paths"
  import { guidePages } from "$lib/meta/guide-pages"

  let { slug }: { slug: string } = $props()

  const meta = $derived(guidePages.get(slug))
  const {
    grades = [],
    basic = false,
    title
  } = $derived.by(() => {
    if (meta) return meta
    throw new Error(`PageLink: No metadata found for slug "${slug}"`)
  })

  // @ts-expect-error
  let href = $derived(resolve(`/color-theory/${slug}`))

  const gradeColors = {
    "3": "#c4b5fd",
    "2": "#6ee7b7",
    "1": "#fde68a",
    uc: "#93c5fd"
  }

  let accentColor = $derived(grades.length > 0 ? gradeColors[grades[0]] : "#94a3b8")
</script>

<a {href} class="page-link" style="--pl-accent: {accentColor}">
  <span class="pl-title">{title}</span>
  {#if grades.length > 0 || basic}
    <span class="pl-grades">
      {#if basic}
        <GradeTag grade="basic" />
      {/if}
      {#each grades as grade (grade)}
        <GradeTag {grade} />
      {/each}
    </span>
  {/if}
</a>

<style>
  .page-link {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    text-decoration: none;
    color: inherit;
    position: relative;
    padding: 0.5rem 0 0.5rem 1.5rem;
    transition: color 0.2s;
    column-gap: 0.5rem;
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
    align-self: flex-end;
  }
</style>
