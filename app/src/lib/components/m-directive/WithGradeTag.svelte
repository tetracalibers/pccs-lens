<script lang="ts">
  import type { Snippet } from "svelte"
  import GradeTag from "./GradeTag.svelte"

  type Grade = "basic" | "3" | "2" | "1" | "uc"

  let { children, grade }: { children?: Snippet; grade: Grade } = $props()
</script>

<div class="with-grade-tag">
  <span class="text">{@render children?.()}</span>
  <GradeTag {grade} />
</div>

<style>
  .with-grade-tag {
    display: inline;
  }
  .with-grade-tag :global(.grade-tag) {
    vertical-align: 0.25lh;
    line-height: 1.3;
  }
</style>
