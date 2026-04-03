<script lang="ts">
  import type { Snippet } from "svelte"
  import GradeTag from "./GradeTag.svelte"

  type Grade = "3" | "2" | "1" | "uc"
  type GradeCSV = Grade | `${Grade},${Grade}` | `${Grade},${Grade},${Grade}`

  let { children, grades }: { children?: Snippet; grades: GradeCSV } = $props()
  const gradeList = $derived(grades.split(",") as Grade[])
</script>

<div class="with-grade-tag">
  <span class="text">{@render children?.()}</span>
  <div class="grade-tags">
    {#each gradeList as grade (grade)}
      <GradeTag {grade} />
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
