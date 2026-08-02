<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import PCCSColor from "../PCCSColor.svelte"

  type ColorsListItem = {
    pccs: string
    name: string
    labelPccs: string
  }

  let { colors }: { colors: ColorsListItem[] } = $props()
</script>

<ul class="list">
  {#each colors as { pccs, name, labelPccs } (name)}
    <li style:--_pccs-color={PCCS_HEX_MAP.get(labelPccs)!}>
      <span class="label">{name}</span>
      <PCCSColor {pccs} />
    </li>
  {/each}
</ul>

<style>
  .list {
    display: flex;
    gap: 4px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .list li {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .list .label {
    font-family: var(--font-classic);
    font-size: 1.25rem;
    color: var(--_pccs-color);
  }
</style>
