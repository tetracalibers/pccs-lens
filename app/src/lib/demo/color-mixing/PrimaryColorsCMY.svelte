<script lang="ts">
  import PrimaryColors from "./PrimaryColors.svelte"

  const PCCS_CMY_LIST = [
    { pccs: "v16", name: "C" },
    { pccs: "v24", name: "M" },
    { pccs: "v8", name: "Y" }
  ]
</script>

<PrimaryColors colors={PCCS_CMY_LIST} />
