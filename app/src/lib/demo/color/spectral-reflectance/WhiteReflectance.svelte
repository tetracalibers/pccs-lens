<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 白：全波長域でほぼ一様に高い反射率
  const whiteReflectance = [
    { nm: 380, value: 86 },
    { nm: 420, value: 88 },
    { nm: 460, value: 89 },
    { nm: 500, value: 90 },
    { nm: 540, value: 90 },
    { nm: 580, value: 91 },
    { nm: 620, value: 91 },
    { nm: 660, value: 91 },
    { nm: 700, value: 91 },
    { nm: 740, value: 90 },
    { nm: 780, value: 90 }
  ]
</script>

<SpectralReflectanceGraph points={whiteReflectance} id="white" />
