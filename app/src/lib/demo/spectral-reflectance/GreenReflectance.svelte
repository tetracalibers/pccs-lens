<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 緑：中波長域で高い反射率、両端は低い
  const greenReflectance = [
    { nm: 380, value: 8 },
    { nm: 420, value: 8 },
    { nm: 460, value: 13 },
    { nm: 490, value: 25 },
    { nm: 510, value: 45 },
    { nm: 530, value: 70 },
    { nm: 550, value: 80 },
    { nm: 570, value: 70 },
    { nm: 590, value: 45 },
    { nm: 620, value: 22 },
    { nm: 660, value: 12 },
    { nm: 700, value: 9 },
    { nm: 740, value: 8 },
    { nm: 780, value: 8 }
  ]
</script>

<SpectralReflectanceGraph points={greenReflectance} id="green" />
