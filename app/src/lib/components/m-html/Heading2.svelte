<script lang="ts">
  import { type Snippet } from "svelte"
  import GradeTag from "../m-directive/GradeTag.svelte"
  import AnkiEnabledHeadingText from "../AnkiEnabledHeadingText.svelte"
  import { type AftGradeCSV, gradeCSV2Array } from "$lib/meta/grade"
  import { ankiMode } from "$lib/state/anki.svelte"

  let {
    children,
    title = "",
    grades = ""
  }: { children?: Snippet; title?: string; grades?: string } = $props()

  const isAnki = $derived(ankiMode.isAnki)
  const gradeList = $derived(grades ? gradeCSV2Array(grades as AftGradeCSV) : [])
</script>

<h2 class:--_anki={isAnki}>
  <span class="dot"></span>
  {#if isAnki && title}
    <div>
      <AnkiEnabledHeadingText text={title} />
      <div class="grade-tags">
        {#each gradeList as grade (grade)}
          <GradeTag {grade} />
        {/each}
      </div>
    </div>
  {:else}
    {@render children?.()}
  {/if}
</h2>

<style>
  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--color-heading);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: flex-start;
    gap: 0.55rem;
    line-height: 1.3;
    margin: 2rem 0 0.75rem;
    min-height: 1lh;
  }

  h2.--_anki {
    gap: 0.75rem;
  }

  .dot {
    display: inline-block;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    translate: 0 11.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }

  .grade-tags {
    display: inline-flex;
    gap: 4px;
    translate: 0 calc(50% - 0.5lh);
  }

  .grade-tags :global(.grade-tag) {
    line-height: 1.3;
  }
</style>
