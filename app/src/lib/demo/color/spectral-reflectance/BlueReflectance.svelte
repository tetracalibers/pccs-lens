<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 青：短波長域で高い反射率、長波長側は低い
  const blueReflectance = [
    { nm: 380, value: 70 },
    { nm: 410, value: 82 },
    { nm: 440, value: 88 },
    { nm: 470, value: 85 },
    { nm: 500, value: 65 },
    { nm: 530, value: 35 },
    { nm: 560, value: 18 },
    { nm: 590, value: 10 },
    { nm: 620, value: 7 },
    { nm: 660, value: 6 },
    { nm: 700, value: 5 },
    { nm: 740, value: 5 },
    { nm: 780, value: 5 }
  ]
</script>

<SpectralReflectanceGraph points={blueReflectance} id="blue" />
