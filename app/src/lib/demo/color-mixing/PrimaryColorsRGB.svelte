<script lang="ts">
  import PrimaryColors from "./PrimaryColors.svelte"

  const PCCS_RGB_LIST = [
    { pccs: "v3", name: "R" },
    { pccs: "v12", name: "G" },
    { pccs: "v19", name: "B" }
  ]
</script>

<PrimaryColors colors={PCCS_RGB_LIST} />
