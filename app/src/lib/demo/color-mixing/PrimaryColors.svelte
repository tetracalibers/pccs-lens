<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import PCCSColor from "../PCCSColor.svelte"

  type ColorsListItem = {
    pccs: string
    name: string
  }

  let { colors }: { colors: ColorsListItem[] } = $props()
</script>

<ul class="list">
  {#each colors as { pccs, name } (name)}
    <li style:--_pccs-color={PCCS_HEX_MAP.get(pccs)!}>
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

    /** 白く縁取り */
    -webkit-text-stroke: 2px #fff;
    paint-order: stroke fill;
  }
</style>
