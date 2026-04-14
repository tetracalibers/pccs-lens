<script lang="ts">
  import PCCSColor from "../PCCSColor.svelte"

  interface Props {
    /** 基準となる色相番号 */
    baseHue: number
    /** 色相差 */
    hueDiff: number
    /** 回転方向（時計回りか反時計回りか） */
    rotation: "cw" | "ccw"
  }

  let { baseHue, hueDiff, rotation }: Props = $props()

  const targetHue = $derived(() => {
    const diff = rotation === "cw" ? hueDiff : -hueDiff
    return ((baseHue - 1 + diff + 24) % 24) + 1
  })
</script>

<div class="palette-preview">
  <PCCSColor pccs={`v${baseHue}`} />
  <PCCSColor pccs={`v${targetHue()}`} />
</div>

<style>
  .palette-preview {
    display: flex;
  }
</style>
