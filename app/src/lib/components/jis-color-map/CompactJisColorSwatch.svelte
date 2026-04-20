<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"

  interface Props {
    colors: JISColor[]
    variant?: "fill" | "outline"
  }

  let { colors, variant = "fill" }: Props = $props()

  const bgHex = $derived(colors[0].hex)
  const title = $derived(colors.map((c) => `${c.name}（${c.reading}）`).join("\n"))
</script>

<div
  class="swatch"
  class:--_outline={variant === "outline"}
  style:--_jis-color-hex={bgHex}
  {title}
></div>

<style>
  .swatch {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    background-color: var(--_jis-color-hex);
  }

  .--_outline {
    background: none;
    border: 2px solid var(--_jis-color-hex);
    box-sizing: border-box;
  }
</style>
