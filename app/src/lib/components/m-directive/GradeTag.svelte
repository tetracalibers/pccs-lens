<script lang="ts">
  import Icon from "@iconify/svelte"
  import type { AftGrade } from "$lib/meta/grade"

  type Grade = "basic" | AftGrade

  let { grade }: { grade: Grade } = $props()

  const labels: Record<Grade, string> = {
    basic: "便利",
    "3": "3級",
    "2": "2級",
    "1": "1級",
    uc: "UC級"
  }
</script>

<span class="grade-tag" data-grade={grade}>
  {#if grade === "basic"}
    <Icon icon="solar:star-shine-bold" class="grade-tag-icon" />
  {/if}
  {labels[grade]}
</span>

<style>
  .grade-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 4px 6px;
    border-radius: 4px;
    color: #1a1a2e;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .grade-tag[data-grade="basic"] {
    background: #ff7675;
    color: #ffffff;
    font-size: 0.82rem;
    display: inline-flex;
    gap: 2px;
    justify-content: center;
  }

  .grade-tag[data-grade="basic"] :global(.grade-tag-icon) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }

  .grade-tag[data-grade="3"] {
    background: #c4b5fd;
  }

  .grade-tag[data-grade="2"] {
    background: #6ee7b7;
  }

  .grade-tag[data-grade="1"] {
    background: #fde68a;
  }

  .grade-tag[data-grade="uc"] {
    background: #93c5fd;
  }
</style>
