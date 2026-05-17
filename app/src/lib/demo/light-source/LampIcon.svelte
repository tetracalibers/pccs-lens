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

<Icon icon="ion:bulb" style="color: {color}" width={size} />
