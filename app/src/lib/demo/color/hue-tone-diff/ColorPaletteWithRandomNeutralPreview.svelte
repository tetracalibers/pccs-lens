<script lang="ts">
  import { PCCS_ACHROMATIC_TONE_SYMBOLS } from "$lib/data/pccs-tone"
  import PCCSColor from "../PCCSColor.svelte"

  interface Props {
    hue: number
  }

  let { hue }: Props = $props()

  // ランダムに無彩色トーンを選ぶ
  const randomTone = $derived(() => {
    const tones = PCCS_ACHROMATIC_TONE_SYMBOLS
    return tones[Math.floor(Math.random() * tones.length)]
  })
</script>

<div class="palette-preview">
  <PCCSColor pccs={`v${hue}`} />
  <PCCSColor pccs={randomTone()} />
</div>

<style>
  .palette-preview {
    display: flex;
    gap: 2px;
  }
</style>
