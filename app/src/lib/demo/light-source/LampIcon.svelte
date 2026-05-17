<script lang="ts">
  import Icon from "@iconify/svelte"
  import chroma from "chroma-js"

  interface Props {
    temperature: number
  }

  let { temperature }: Props = $props()

  const color = $derived(chroma.temperature(temperature).hex())
</script>

<Icon icon="ion:bulb" style="color: {color}" width="36" />
