<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import Icon from "@iconify/svelte"

  const ROW_ON_WHITE = ["v5", "v8", "v2"]
  const ROW_ON_BLACK = ["v2", "v5", "v8"]
</script>

<div class="container">
  <div class="row row--white">
    {#each ROW_ON_WHITE as notation (notation)}
      <Icon
        icon="material-symbols-light:warning-rounded"
        width="62"
        style="color: {PCCS_HEX_MAP.get(notation)};"
      ></Icon>
    {/each}
  </div>
  <div class="row row--black">
    {#each ROW_ON_BLACK as notation (notation)}
      <Icon
        icon="material-symbols-light:warning-rounded"
        width="62"
        style="color: {PCCS_HEX_MAP.get(notation)};"
      ></Icon>
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem;
    border: 1px solid var(--color-body);
    border-radius: 0.5rem;
  }

  .row--white {
    background-color: #ffffff;
  }

  .row--black {
    background-color: #000000;
  }
</style>
