<script lang="ts">
  import type { CgGroup } from "$lib/meta/group"
  import GroupTag from "./GroupTag.svelte"

  let { title, group }: { title: string; group: CgGroup[] } = $props()
</script>

<div class="cg-page-title">
  <span class="cg-title">{title}</span>
  {#if group.length > 0}
    <span class="cg-groups">
      {#each group as g (g)}
        <GroupTag group={g} />
      {/each}
    </span>
  {/if}
</div>

<style>
  .cg-page-title {
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

  .cg-page-title::before {
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

  .cg-title {
    min-width: 0;
    width: fit-content;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .cg-groups {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-inline-start: auto;
    align-self: flex-end;
  }
</style>
