<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import PlaybackStage from "$lib/demo/PlaybackStage.svelte"

  const RED = PCCS_HEX_MAP.get("v2")!
  const DURATION_SEC = 30
</script>

<PlaybackStage duration={DURATION_SEC}>
  {#snippet children({ phase })}
    {#if phase !== "finished"}
      <div class="circle" style:background-color={RED}></div>
    {/if}
  {/snippet}
</PlaybackStage>

<style>
  .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70cqh;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
  }
</style>
