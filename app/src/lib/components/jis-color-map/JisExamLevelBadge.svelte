<script lang="ts">
  interface Props {
    examLevel: 2 | 3 | null
    size?: "S" | "M"
  }

  let { examLevel, size = "S" }: Props = $props()
</script>

{#if examLevel !== null}
  <span
    class="level"
    class:level-2={examLevel === 2}
    class:level-3={examLevel === 3}
    class:size-m={size === "M"}
  >
    {examLevel}級
  </span>
{:else}
  <span class="level level-none"></span>
{/if}

<style>
  .level {
    padding: 0.3rem;
    border-radius: 4px;
    font-size: 0.7rem;
    text-align: center;
    color: #1a1a2e;
    line-height: 1;
    align-self: center;
  }

  .size-m {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .level-2 {
    background-color: var(--color-grade-2);
  }

  .level-3 {
    background-color: var(--color-grade-3);
  }

  .level-none {
    visibility: hidden;
  }
</style>
