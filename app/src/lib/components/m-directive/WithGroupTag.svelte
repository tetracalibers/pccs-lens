<script lang="ts">
  import type { Snippet } from "svelte"
  import GroupTag from "./GroupTag.svelte"
  import type { CgGroup } from "$lib/meta/group"

  let { children, group = [] }: { children?: Snippet; group?: CgGroup[] } = $props()
</script>

<div class="with-group-tag">
  <span class="text">{@render children?.()}</span>
  <div class="group-tags">
    {#each group as g (g)}
      <GroupTag group={g} />
    {/each}
  </div>
</div>

<style>
  .group-tags {
    display: inline-flex;
    gap: 4px;
    translate: 0 calc(50% - 0.5lh);
  }

  .group-tags :global(.group-tag) {
    line-height: 1.3;
  }
</style>
