<script lang="ts" module>
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import Heading3 from "$lib/components/m-html/Heading3.svelte"
  import Heading4 from "$lib/components/m-html/Heading4.svelte"
  import Ulist from "$lib/components/m-html/Ulist.svelte"
  import Olist from "$lib/components/m-html/Olist.svelte"
  import ALink from "$lib/components/m-html/ALink.svelte"

  import Tips from "$lib/components/m-directive/Tips.svelte"
  import Note from "$lib/components/m-directive/Note.svelte"
  import Example from "$lib/components/m-directive/Example.svelte"
  import ComingSoon from "$lib/components/m-directive/ComingSoon.svelte"
  import GradeTag from "$lib/components/m-directive/GradeTag.svelte"

  /* eslint-disable no-import-assign */
  export {
    Heading2 as h2,
    Heading3 as h3,
    Heading4 as h4,
    Ulist as ul,
    Olist as ol,
    ALink as a,
    Tips,
    Note,
    Example,
    ComingSoon,
    GradeTag
  }
  /* eslint-enable no-import-assign */
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import Heading1 from "$lib/components/Heading1.svelte"
  import type { GuideFrontmatter } from "$lib/meta/guide-pages"

  let { children }: GuideFrontmatter & { children: Snippet } = $props()
</script>

<svelte:head>
  <title>このサイトについて — PCCS Lens</title>
</svelte:head>

<main>
  <Heading1 icon="hugeicons:message-question" grayscale>このサイトについて</Heading1>
  <div>{@render children()}</div>
</main>

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  }

  main :global(p) {
    color: light-dark(#556070, #f0f0f0);
    color: var(--color-body);
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
  }
</style>
