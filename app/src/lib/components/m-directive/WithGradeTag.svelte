<script lang="ts">
  import type { Snippet } from "svelte"
  import GradeTag from "./GradeTag.svelte"
  import { type AftGradeCSV, gradeCSV2Array } from "$lib/meta/grade"

  let { children, grades }: { children?: Snippet; grades: AftGradeCSV } = $props()
  const gradeList = $derived(gradeCSV2Array(grades))
</script>

<div class="with-grade-tag">
  <span class="text">{@render children?.()}</span>
  <div class="grade-tags">
    {#each gradeList as grade (grade)}
      <GradeTag {grade} compactH />
    {/each}
  </div>
</div>

<style>
  .grade-tags {
    display: inline-flex;
    gap: 4px;
    translate: 0 calc(50% - 0.5lh);
  }

  .grade-tags :global(.grade-tag) {
    line-height: 1.3;
  }
</style>
