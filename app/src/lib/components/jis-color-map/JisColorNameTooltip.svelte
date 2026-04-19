<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"

  let {
    colors,
    anchorName,
    popoverId,
    popoverRef = $bindable()
  }: {
    colors: JISColor[]
    anchorName: string
    popoverId: string
    popoverRef?: HTMLElement | null
  } = $props()
</script>

<div
  id={popoverId}
  popover="manual"
  bind:this={popoverRef}
  class="tooltip"
  style:position-anchor={anchorName}
  role="tooltip"
>
  {#each colors as color, i (color.id)}
    {#if i > 0}
      <hr class="sep" />
    {/if}
    <div class="entry">
      <div class="name">
        {#if color.nameSegments}
          {#each color.nameSegments as segment, si (si)}
            {segment}{#if si < color.nameSegments.length - 1}<br />{/if}
          {/each}
        {:else}
          {color.name}
        {/if}
      </div>
      <div class="reading">{color.reading}</div>
    </div>
  {/each}
</div>

<style>
  .tooltip {
    position: absolute;
    position-area: block-end;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #d0d0d0);
    border-radius: 6px;
    background: var(--color-bg, #fff);
    color: var(--color-body, #222);
    font-family: var(--font-round);
    font-size: 0.8rem;
    line-height: 1.3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    max-width: 14rem;
    text-align: center;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .name {
    font-weight: 600;
  }

  .reading {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  .sep {
    border: none;
    border-top: 1px solid var(--color-border, #d0d0d0);
    margin: 0.4rem 0;
  }
</style>
