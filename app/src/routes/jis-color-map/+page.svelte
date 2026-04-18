<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import JisColorMap from "$lib/components/jis-color-map/JisColorMap.svelte"
</script>

<svelte:head>
  <title>慣用色名マップ — PCCS Lens</title>
</svelte:head>

<main>
  <div class="header">
    <Heading1 icon="mdi:palette-swatch" grayscale compact>慣用色名マップ</Heading1>
  </div>

  <JisColorMap groupId="red" />
</main>

<style>
  .header {
    margin-bottom: 1.5rem;
    padding: 0 1rem;
    margin-inline: auto;
    width: fit-content;
  }
</style>
