<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import Icon from "@iconify/svelte"
</script>

<div class="sign" style:background-color={PCCS_HEX_MAP.get("v12")}>
  <span class="label">EXIT</span>
  <Icon icon="mdi:exit-run" width="72" />
</div>

<style>
  .sign {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    height: 100px;
    padding-block: 0;
    padding-inline-start: 3rem;
    padding-inline-end: 2.5rem;
    color: #ffffff;
    margin-block: 1.25rem;
    margin-inline: auto;
    width: fit-content;
  }

  .label {
    font-family: var(--font-ja);
    font-weight: bold;
    font-size: 2.75rem;
    letter-spacing: 0.05em;
    line-height: 1;
  }
</style>
