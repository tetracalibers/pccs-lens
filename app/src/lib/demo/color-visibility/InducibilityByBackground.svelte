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
    max-width: 400px;
    margin-inline: auto;
    border: 1px solid light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.15));
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    padding: 1rem;
  }

  .row--white {
    background-color: #ffffff;
  }

  .row--black {
    background-color: #000000;
  }
</style>
