<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Props {
    hex: string
    label?: string
  }

  let { hex, label }: Props = $props()

  const isLightBg = $derived(isLightColor(hex))
  const isAnki = $derived(ankiMode.isAnki)
</script>

<div class="square" style:--_hex-color={hex} style:--_text-color={isLightBg ? "black" : "white"}>
  {isAnki ? "" : (label ?? "")}
</div>

<style>
  .square {
    --_square-size: 4rem;
    --_black-border: rgba(0, 0, 0, 0.2);
    --_white-border: rgba(255, 255, 255, 0.25);

    width: var(--_square-size);
    height: var(--_square-size);
    color: var(--_text-color);
    background-color: var(--_hex-color);
    display: grid;
    place-items: center;
    text-align: center;
    padding: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.3;
    flex-shrink: 0;
    box-sizing: border-box;
    border: 1px solid light-dark(var(--_black-border), var(--_white-border));
  }
</style>
