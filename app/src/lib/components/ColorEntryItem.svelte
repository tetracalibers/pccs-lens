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
  </div>
  <div class="remove-col">
    {#if showRemove}
      <button class="remove-btn" onclick={onRemove} aria-label="この色を削除">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            d="M9.5 14.5v-3m5 3v-3M3 6.5h18c-1.404 0-2.107 0-2.611.337a2 2 0 0 0-.552.552C17.5 7.893 17.5 8.596 17.5 10v5.5c0 1.886 0 2.828-.586 3.414s-1.528.586-3.414.586h-3c-1.886 0-2.828 0-3.414-.586S6.5 17.386 6.5 15.5V10c0-1.404 0-2.107-.337-2.611a2 2 0 0 0-.552-.552C5.107 6.5 4.404 6.5 3 6.5Zm6.5-3s.5-1 2.5-1s2.5 1 2.5 1"
            stroke-width="1.5"
          />
        </svg>
      </button>
    {/if}
  </div>
  <div class="approx-row">
    <span class="label badge-label">PCCS近似</span>
    <div class="approx-badge">
      <span class="swatch swatch--main" aria-label={selectedPCCS.hex}>
        <span class="swatch-bg"></span>
        <span class="swatch-preview" style="background-color: {selectedPCCS.hex}"></span>
      </span>
      <span class="notation">{selectedPCCS.notation}</span>
    </div>
    <span class="label alternates-label">他の近似候補</span>
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
    display: grid;
    grid-template-areas: "input remove-btn";
    align-items: center;
    row-gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    background: var(--color-surface, #fff);
    min-width: 0;
  }

  .remove-col {
    grid-area: remove-btn;
    align-self: start;
  }
  .remove-btn {
    margin-inline-start: 0.3rem;
    margin-inline-end: -0.5rem;
    translate: 0 -0.5rem;
    border: 0;
    padding: 0.2rem;
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    color: var(--color-text-secondary, #a1a1a1);
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
    grid-template-areas: "badge-label alternates-label" "badge alternates";
  }

  .approx-badge {
    grid-area: badge;
    display: flex;
    align-items: center;
    gap: 0.375rem;
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
    color: var(--color-text-secondary, #777);
  }
  .badge-label {
    grid-area: badge-label;
    font-size: 0.7rem;
  }
  .alternates-label {
    grid-area: alternates-label;
    justify-self: end;
    align-self: end;
    font-size: 0.6rem;
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
  .alt-swatch:hover::after {
    content: attr(title);
    position: absolute;
    background: var(--color-text, #111);
    color: #fff;
    padding: 0.25rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    transform: translate(-50%, -165%);
    pointer-events: none;
  }
</style>
