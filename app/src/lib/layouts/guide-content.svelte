<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import Heading3 from "$lib/components/m-html/Heading3.svelte"
  import Heading4 from "$lib/components/m-html/Heading4.svelte"
  import Ulist from "$lib/components/m-html/Ulist.svelte"
  import Olist from "$lib/components/m-html/Olist.svelte"
  import ALink from "$lib/components/m-html/ALink.svelte"
  import Blockquote from "$lib/components/m-html/Blockquote.svelte"

  import Mark from "$lib/components/m-directive/Mark.svelte"
  import GradeTag from "$lib/components/m-directive/GradeTag.svelte"
  import WithGradeTag from "$lib/components/m-directive/WithGradeTag.svelte"
  import Tips from "$lib/components/m-directive/Tips.svelte"
  import Note from "$lib/components/m-directive/Note.svelte"
  import Example from "$lib/components/m-directive/Example.svelte"
  import CardGrid from "$lib/components/m-directive/CardGrid.svelte"
  import TermCard from "$lib/components/m-directive/TermCard.svelte"
  import ComingSoon from "$lib/components/m-directive/ComingSoon.svelte"
  import EnhancedImage from "$lib/components/m-directive/EnhancedImage.svelte"

  /* eslint-disable no-import-assign */
  export {
    Heading2 as h2,
    Heading3 as h3,
    Heading4 as h4,
    Ulist as ul,
    Olist as ol,
    ALink as a,
    Blockquote as blockquote,
    Mark,
    GradeTag,
    WithGradeTag,
    Tips,
    Note,
    Example,
    CardGrid,
    TermCard,
    ComingSoon,
    EnhancedImage as EImage
  }
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/Heading1.svelte"
  import type { GuideFrontmatter } from "$lib/meta/guide-pages"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import { resolve } from "$app/paths"
  import { sortGrades } from "$lib/meta/grade"
  import DraftTag from "$lib/components/DraftTag.svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  import "katex/dist/katex.min.css"

  let { title, grades, basic, draft, children }: GuideFrontmatter & { children: Snippet } = $props()

  const isAnki = $derived(ankiMode.isAnki)

  const pageTitle = $derived(title ? `${title} - PCCS Lens` : "PCCS Lens")
  const gradeList = $derived(sortGrades(grades))
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
  <div class="page-meta">
    {#if grades.length > 0 || basic || draft}
      <div class="page-grades">
        {#if draft}
          <DraftTag />
        {/if}
        {#each gradeList as grade (grade)}
          <GradeTag {grade} />
        {/each}
        {#if basic}
          <GradeTag grade="basic" />
        {/if}
      </div>
    {/if}
  </div>
  <div class:--_anki={isAnki}>{@render children()}</div>
</main>

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  }

  .page-meta {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-block-end: 2.5rem;
  }

  .page-grades {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    margin-inline-start: -4px;
  }

  :where(main :global(p)) {
    color: light-dark(#556070, #f0f0f0);
    color: var(--color-body);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }

  main :global(code) {
    font-family: var(--font-mono);
    padding-inline: 4px;
    display: inline-block;
    line-height: 1.3;
  }

  main :global(pre) {
    color: var(--color-body);
  }
  main :global(pre.language-math) {
    width: fit-content;
    margin-inline: auto;
    margin-block: 2rem;
  }

  main :global(figure.math-display) {
    margin-inline: auto;
    margin-block: 1rem;
    color: var(--color-body);
    max-width: 100%;
    overflow-x: auto;
    box-sizing: border-box;
  }

  main :global(.katex *) {
    font-family: var(--font-math-base), KaTeX_Main;
  }

  main :global(.math-inline .katex *) {
    font-size: 1rem;
  }

  main :global(img) {
    width: 100%;
    height: auto;
    margin: 0.75rem auto;
  }

  main :global(.mermaid-diagram) {
    margin: 1.5rem 0;
    max-width: 100%;
    overflow-x: auto;
  }

  .--_anki :global(.mermaid-diagram [data-id^="Anki"] text) {
    fill: transparent;
  }
</style>
