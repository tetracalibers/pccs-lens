<script lang="ts">
  import type { PCCSColor } from "$lib/data/types"

  let {
    inputHexList,
    displayedPCCSList
  }: {
    inputHexList: string[]
    displayedPCCSList: PCCSColor[]
  } = $props()
</script>

<div class="preview">
  <div class="row">
    <span class="label">入力色</span>
    <div class="swatches">
      {#each inputHexList as hex, i (i)}
        <span class="swatch" style="background-color: {hex}" title={hex}></span>
      {/each}
    </div>
  </div>
  <div class="row">
    <span class="label">PCCS近似色</span>
    <div class="swatches">
      {#each displayedPCCSList as color, i (i)}
        <span
          class="swatch"
          style="background-color: {color.hex}"
          title="{color.notation} {color.hex}"
        ></span>
      {/each}
    </div>
  </div>
</div>

<style>
  .preview {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #777);
    min-width: 6em;
    flex-shrink: 0;
  }

  .swatches {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .swatch {
    display: inline-block;
    width: 40px;
    height: 40px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
