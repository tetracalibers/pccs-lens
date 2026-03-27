<script lang="ts">
  import { isValidHexColor } from "$lib/color/validate"

  let {
    value = $bindable("#EE0026"),
    oninput,
    onchange
  }: { value: string; oninput?: (hex: string) => void; onchange?: (hex: string) => void } = $props()

  let textInput = $state(value)
  let error = $state("")

  function onColorInput(e: Event) {
    const v = (e.target as HTMLInputElement).value
    value = v
    textInput = v
    error = ""
    oninput?.(v)
  }

  function onColorChange(e: Event) {
    const v = (e.target as HTMLInputElement).value
    onchange?.(v)
  }

  function onTextInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value
    textInput = raw

    const normalized = raw.startsWith("#") ? raw : "#" + raw
    if (isValidHexColor(normalized)) {
      value = normalized
      textInput = normalized
      error = ""
      oninput?.(normalized)
      onchange?.(normalized)
    } else {
      error = "6桁または3桁の有効なHEXコードを入力してください（例：#EE0026）"
    }
  }
</script>

<div class="color-picker">
  <input
    type="color"
    bind:value
    oninput={onColorInput}
    onchange={onColorChange}
    aria-label="カラーピッカー"
  />
  <input
    type="text"
    value={textInput}
    oninput={onTextInput}
    placeholder="#000000"
    aria-label="HEXコード入力"
    aria-invalid={!!error}
    class:invalid={!!error}
  />
</div>
{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

<style>
  .color-picker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="color"] {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.125rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 0.25rem;
    cursor: pointer;
    background: none;
  }

  input[type="text"] {
    font-family: var(--font-mono);
    font-size: 1rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 0.25rem;
    width: 8rem;
  }

  input[type="text"].invalid {
    border-color: var(--color-error, #cc0000);
  }

  .error {
    font-size: 0.8rem;
    color: var(--color-error, #cc0000);
    margin: 0.25rem 0 0;
  }
</style>
