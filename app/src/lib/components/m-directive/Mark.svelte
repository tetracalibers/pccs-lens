<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<span class="mark -brackets">
  {@render children?.()}
</span>

<style>
  .mark.-brackets {
    line-height: 1;
    font-weight: 600;
  }

  .mark.-brackets::before {
    content: "「";
  }

  .mark.-brackets::after {
    content: "」";
  }
</style>
