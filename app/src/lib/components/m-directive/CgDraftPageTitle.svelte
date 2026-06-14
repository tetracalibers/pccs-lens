<script lang="ts">
  import type { CgGroup } from "$lib/content-pages/cg"

  let { title, group }: { title: string; group: CgGroup[] } = $props()

  const labels: Record<CgGroup, string> = { CG: "CG", ImgP: "画像処理" }
</script>

<div class="cg-page-title">
  <span class="cg-title">{title}</span>
  {#if group.length > 0}
    <span class="cg-groups">
      {#each group as g (g)}
        <span class="group-tag" data-group={g}>{labels[g]}</span>
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

  .group-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.3;
    padding: 4px 8px;
    border-radius: 20px;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
    border: 1px solid var(--_color);
    background-color: oklch(from var(--_color) l c h / 10%);
    color: oklch(from var(--_color) calc(l * 0.9) c h);
  }

  .group-tag[data-group="CG"] {
    --_color: #c77dff;
  }

  .group-tag[data-group="ImgP"] {
    --_color: #4dabf7;
  }
</style>
