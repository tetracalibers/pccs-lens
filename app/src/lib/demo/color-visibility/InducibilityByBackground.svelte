<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  const ROW_ON_WHITE = ["v5", "v8", "v2"]
  const ROW_ON_BLACK = ["v5", "v2", "v8"]
</script>

<div class="container">
  <div class="row row--white">
    {#each ROW_ON_WHITE as notation (notation)}
      <div class="swatch" style:background-color={PCCS_HEX_MAP.get(notation)}></div>
    {/each}
  </div>
  <div class="row row--black">
    {#each ROW_ON_BLACK as notation (notation)}
      <div class="swatch" style:background-color={PCCS_HEX_MAP.get(notation)}></div>
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem 1.25rem;
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 1.75rem;
    padding: 1.25rem;
    border: 1px solid var(--color-body);
  }

  .row--white {
    background-color: #ffffff;
  }

  .row--black {
    background-color: #000000;
  }

  .swatch {
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
  }
</style>
