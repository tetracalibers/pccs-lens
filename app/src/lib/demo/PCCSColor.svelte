<script lang="ts">
  import { isLightColor } from "$lib/color/utils"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { pccs }: { pccs: string } = $props()

  const color = $derived(PCCS_HEX_MAP.get(pccs)!)
  const isLightBg = $derived(isLightColor(color))

  const isAnki = $derived(ankiMode.isAnki)
</script>

<div
  class="square"
  style:--_pccs-color={color}
  style:--_text-color={isLightBg ? "black" : "white"}
  class:--_white-tone={pccs === "W"}
  class:--_black-tone={pccs === "Bk"}
  class:--_small-font={pccs.startsWith("Gy-")}
>
  {isAnki ? "" : pccs}
</div>

<style>
  .square {
    --_square-size: 3rem;
    --_black-border: rgba(0, 0, 0, 0.2);
    --_white-border: rgba(255, 255, 255, 0.2);

    width: var(--_square-size);
    height: var(--_square-size);
    color: var(--_text-color);
    background-color: var(--_pccs-color);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .square.--_small-font {
    font-size: 0.65rem;
  }

  .square.--_white-tone {
    border: 1px solid light-dark(var(--_black-border), transparent);
  }
  .square.--_black-tone {
    border: 1px solid light-dark(transparent, var(--_white-border));
  }
</style>
