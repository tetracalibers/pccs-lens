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
    <div class="approx-badge">
      <span
        class="swatch swatch--main"
        style="background-color: {selectedPCCS.hex}"
        aria-label={selectedPCCS.hex}
      ></span>
      <span class="notation">{selectedPCCS.notation}</span>
      <span class="label">近似</span>
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

  .input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .approx-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .swatch--main {
    display: inline-block;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.25rem;
    border: 2px solid var(--color-text, #111);
    flex-shrink: 0;
  }

  .notation {
    font-family: monospace;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .label {
    font-size: 0.7rem;
    color: var(--color-text-secondary, #777);
  }

  .alternates {
    display: flex;
    gap: 0.375rem;
    align-items: center;
  }

  .alt-swatch {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--color-border, #ccc);
    cursor: pointer;
    padding: 0;
    opacity: 0.75;
    transition:
      opacity 0.15s,
      transform 0.1s;
  }

  .alt-swatch:hover {
    opacity: 1;
    transform: scale(1.1);
    border-color: var(--color-text, #111);
  }
</style>
