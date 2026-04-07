<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import Heading3 from "$lib/components/m-html/Heading3.svelte"
  import Heading4 from "$lib/components/m-html/Heading4.svelte"
  import Ulist from "$lib/components/m-html/Ulist.svelte"

  import Mark from "$lib/components/m-directive/Mark.svelte"
  import GradeTag from "$lib/components/m-directive/GradeTag.svelte"
  import WithGradeTag from "$lib/components/m-directive/WithGradeTag.svelte"
  import Tips from "$lib/components/m-directive/Tips.svelte"
  import Note from "$lib/components/m-directive/Note.svelte"
  import Example from "$lib/components/m-directive/Example.svelte"
  import CardGrid from "$lib/components/m-directive/CardGrid.svelte"
  import TermCard from "$lib/components/m-directive/TermCard.svelte"
  import ComingSoon from "$lib/components/m-directive/ComingSoon.svelte"

  /* eslint-disable no-import-assign */
  export {
    Heading2 as h2,
    Heading3 as h3,
    Heading4 as h4,
    Ulist as ul,
    Mark,
    GradeTag,
    WithGradeTag,
    Tips,
    Note,
    Example,
    CardGrid,
    TermCard,
    ComingSoon
  }
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/Heading1.svelte"
  import type { GuideFrontmatter } from "$lib/meta/guide-pages"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import { resolve } from "$app/paths"

  let {
    title,
    grades = [],
    basic = false,
    children
  }: GuideFrontmatter & { children: Snippet } = $props()
  const pageTitle = $derived(title ? `${title} - PCCS Lens` : "PCCS Lens")
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<main>
  <Breadcrumb
    category="contents"
    crumbs={[{ label: "色の理論", href: resolve("/color-theory") }, { label: title }]}
  />
  <Heading1 icon="solar:pen-new-round-broken">{title}</Heading1>
  {#if grades.length > 0 || basic}
    <div class="page-grades">
      {#if basic}
        <GradeTag grade="basic" />
      {/if}
      {#each grades as grade (grade)}
        <GradeTag {grade} />
      {/each}
    </div>
  {/if}
  {@render children()}
</main>

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  }

  .page-grades {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    margin-block-end: 2.5rem;
    margin-inline-start: -4px;
  }

  main :global(p) {
    color: light-dark(#556070, #f0f0f0);
    color: var(--color-body);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }

  main :global(.mermaid-diagram) {
    margin: 1.5rem 0;
    max-width: 100%;
    overflow-x: auto;
  }
</style>
