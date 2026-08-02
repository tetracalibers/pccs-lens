<script lang="ts">
  import PrimaryColors from "./PrimaryColors.svelte"

  const PCCS_RGB_LIST = [
    { pccs: "v3", name: "R", labelPccs: "b3" },
    { pccs: "v12", name: "G", labelPccs: "b12" },
    { pccs: "v19", name: "B", labelPccs: "b19" }
  ]
</script>

<PrimaryColors colors={PCCS_RGB_LIST} />
