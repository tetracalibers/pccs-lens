<script lang="ts">
  import Icon from "@iconify/svelte"

  type Grade = "basic" | "3" | "2" | "1" | "uc"

  let { grade }: { grade: Grade } = $props()

  const labels: Record<Grade, string> = {
    basic: "入門",
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
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 3px 8px;
    border-radius: 4px;
    color: #1a1a2e;
  }

  .grade-tag[data-grade="basic"] {
    background: #ff7675;
    color: #ffffff;
    font-size: 0.82rem;
    padding: 4px 8px;
  }

  .grade-tag[data-grade="basic"] :global(.grade-tag-icon) {
    width: 1em;
    height: 1em;
    margin-right: 3px;
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
