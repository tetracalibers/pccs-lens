<script lang="ts">
  import Icon from "@iconify/svelte"
  import chroma from "chroma-js"

  interface Props {
    temperature: number
    size?: number
  }

  let { temperature, size = 36 }: Props = $props()

  const color = $derived(chroma.temperature(temperature).hex())
</script>

<Icon icon="material-symbols-light:lightbulb-rounded" style="color: {color}" width={size} />
