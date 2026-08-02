<script lang="ts">
  import PCCSColor from "../PCCSColor.svelte"

  interface Props {
    pccsSymbols: string[]
  }

  let { pccsSymbols }: Props = $props()
</script>

<div class="palette-preview">
  {#each pccsSymbols as symbol, i (i)}
    <PCCSColor pccs={symbol} />
  {/each}
</div>

<style>
  .palette-preview {
    display: flex;
    gap: 2px;
  }
</style>
