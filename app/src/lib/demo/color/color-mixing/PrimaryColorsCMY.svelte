<script lang="ts">
  import PrimaryColors from "./PrimaryColors.svelte"

  const PCCS_CMY_LIST = [
    { pccs: "v16", name: "C", labelPccs: "b16" },
    { pccs: "v24", name: "M", labelPccs: "b24" },
    { pccs: "v8", name: "Y", labelPccs: "v8" }
  ]
</script>

<PrimaryColors colors={PCCS_CMY_LIST} />
