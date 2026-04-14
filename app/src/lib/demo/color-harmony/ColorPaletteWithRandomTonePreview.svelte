<script lang="ts">
  import { PCCS_CHROMATIC_TONE_SYMBOLS } from "$lib/data/pccs-tone"
  import PCCSColor from "../PCCSColor.svelte"

  interface Props {
    hue: number
  }

  let { hue }: Props = $props()

  // ランダムにv以外の有彩色トーンを選ぶ
  const randomTone = $derived(() => {
    const tones = PCCS_CHROMATIC_TONE_SYMBOLS.filter((tone) => tone !== "v")
    return tones[Math.floor(Math.random() * tones.length)]
  })
</script>

<div class="palette-preview">
  <PCCSColor pccs={`v${hue}`} />
  <PCCSColor pccs={`${randomTone()}${hue}`} />
</div>

<style>
  .palette-preview {
    display: flex;
  }
</style>
