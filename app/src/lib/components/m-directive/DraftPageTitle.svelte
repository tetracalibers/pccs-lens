<script lang="ts">
  import GradeTag from "./GradeTag.svelte"

  type Grade = "3" | "2" | "1" | "uc"
  type GradeCSV = Grade | `${Grade},${Grade}` | `${Grade},${Grade},${Grade}`

  const gradeColors = { "3": "#c4b5fd", "2": "#6ee7b7", "1": "#fde68a", uc: "#93c5fd" }

  let { grades, title }: { grades: GradeCSV; title: string } = $props()

  const gradeList = $derived(grades.split(",") as Grade[])
  let accentColor = $derived(gradeList.length > 0 ? gradeColors[gradeList[0]] : "#94a3b8")
</script>

<div class="draft-page-title" style="--pl-accent: {accentColor}">
  <span class="df-title">{title}</span>
  {#if gradeList.length > 0}
    <span class="df-grades">
      {#each gradeList as grade (grade)}
        <GradeTag {grade} />
      {/each}
    </span>
  {/if}
</div>

<style>
  .draft-page-title {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    text-decoration: none;
    color: inherit;
    font-size: 0.9rem;
    position: relative;
    padding: 0.5rem 0 0.5rem 1.5rem;
    opacity: 0.5;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }

  .draft-page-title::before {
    content: "・";
    display: inline-block;
    width: 1.5rem;
    position: absolute;
    left: 0;
    top: 0.5em;
    padding-inline-end: 1ex;
    text-align: center;
    box-sizing: border-box;
  }

  .df-title {
    min-width: 0;
    width: fit-content;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .df-grades {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-inline-start: auto;
    align-self: flex-end;
  }
</style>
