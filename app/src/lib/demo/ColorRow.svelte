<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="row">
  {@render children()}
</div>

<style>
  .row {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
