<script lang="ts">
  import ColorPicker from "$lib/components/ColorPicker.svelte"
  import type { PCCSColor } from "$lib/data/types"

  let {
    inputHex = $bindable(),
    selectedPCCS,
    alternatePCCS,
    showRemove,
    onHexChange,
    onSelectAlternate,
    onRemove
  }: {
    inputHex: string
    selectedPCCS: PCCSColor
    alternatePCCS: [PCCSColor, PCCSColor]
    showRemove: boolean
    onHexChange: (hex: string) => void
    onSelectAlternate: (alternate: PCCSColor) => void
    onRemove: () => void
  } = $props()
</script>

<li class="color-entry">
  <div class="input-row">
    <ColorPicker bind:value={inputHex} oninput={onHexChange} />
    {#if showRemove}
      <button class="remove-btn" onclick={onRemove} aria-label="この色を削除">×</button>
    {/if}
  </div>
  <div class="approx-row">
    <span class="label">PCCS近似</span>
    <div class="approx-badge">
      <span class="swatch swatch--main" aria-label={selectedPCCS.hex}>
        <span class="swatch-bg"></span>
        <span class="swatch-preview" style="background-color: {selectedPCCS.hex}"></span>
      </span>
      <span class="notation">{selectedPCCS.notation}</span>
    </div>
    <div class="alternates">
      {#each alternatePCCS as alt (alt.notation)}
        <button
          class="alt-swatch"
          onclick={() => onSelectAlternate(alt)}
          style="background-color: {alt.hex}"
          title={alt.notation}
          aria-label="{alt.notation} に変更"
        ></button>
      {/each}
    </div>
  </div>
</li>

<style>
  .color-entry {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    background: var(--color-surface, #fff);
    min-width: 0;
  }

  .remove-btn {
    margin-left: auto;
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-text-secondary, #777);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover {
    background: var(--color-border, #ddd);
    color: var(--color-text, #111);
  }

  .approx-row {
    display: grid;
    grid-template-areas: "label ." "badge alternates";
  }

  .approx-badge {
    grid-area: badge;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .swatch--main {
    display: grid;
    place-items: center;
  }
  .swatch-preview {
    display: inline-block;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.25rem;
    grid-area: 1 / 1;
  }
  .swatch-bg {
    width: 2.5rem;
    height: 2.5rem;
    grid-area: 1 / 1;
    box-sizing: border-box;
  }

  .notation {
    font-family: monospace;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .label {
    grid-area: label;
    font-size: 0.7rem;
    color: var(--color-text-secondary, #777);
  }

  .alternates {
    grid-area: alternates;
    display: flex;
    gap: 0.375rem;
    align-items: center;
    justify-content: flex-end;
  }

  .alt-swatch {
    appearance: none;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: 0;
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s;
  }

  .alt-swatch:hover {
    transform: scale(1.1);
  }
</style>
