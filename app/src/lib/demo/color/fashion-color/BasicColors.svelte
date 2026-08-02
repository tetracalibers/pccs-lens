<script>
  import Icon from "@iconify/svelte"
  import HexColor from "../HexColor.svelte"
  import JISColor from "../JISColor.svelte"
</script>

<div class="fashion-colors">
  <div class="basic-colors-block">
    <div class="basic-color-row-1">
      <HexColor hex="#FFFFFF" label="白" />
      <HexColor hex="#000000" label="黒" />
      <HexColor hex="#808080" label="グレイ" />
    </div>
    <div class="basic-color-row-2">
      <HexColor hex="#1F2D5C" label="紺" />
      <HexColor hex="#D9C8A8" label="ベージュ" />
    </div>
  </div>
  <div class="additional-colors-block">
    <Icon class="plus-icon" icon="dashicons:plus" width="24" height="24" />
    <div class="additional-colors"><JISColor id="khaki" /></div>
  </div>
</div>

<style>
  .fashion-colors {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    width: fit-content;
    margin-inline: auto;
    justify-content: center;
    padding-block: 1rem;
  }

  .additional-colors-block {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: end;
  }

  .basic-colors-block {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .basic-color-row-1,
  .basic-color-row-2 {
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .fashion-colors :global(.plus-icon) {
    flex-shrink: 0;
  }
</style>
