<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 赤：長波長域で高い反射率、それ以外は低い
  const redReflectance = [
    { nm: 380, value: 8 },
    { nm: 420, value: 7 },
    { nm: 460, value: 7 },
    { nm: 500, value: 7 },
    { nm: 540, value: 8 },
    { nm: 570, value: 12 },
    { nm: 590, value: 25 },
    { nm: 610, value: 55 },
    { nm: 630, value: 78 },
    { nm: 660, value: 87 },
    { nm: 700, value: 90 },
    { nm: 740, value: 90 },
    { nm: 780, value: 90 }
  ]
</script>

<SpectralReflectanceGraph points={redReflectance} id="red" />
