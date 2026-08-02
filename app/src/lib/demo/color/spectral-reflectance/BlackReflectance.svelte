<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 黒：全波長域でほぼ一様に低い反射率
  const blackReflectance = [
    { nm: 380, value: 4 },
    { nm: 420, value: 4 },
    { nm: 460, value: 5 },
    { nm: 500, value: 5 },
    { nm: 540, value: 5 },
    { nm: 580, value: 5 },
    { nm: 620, value: 5 },
    { nm: 660, value: 5 },
    { nm: 700, value: 5 },
    { nm: 740, value: 5 },
    { nm: 780, value: 6 }
  ]
</script>

<SpectralReflectanceGraph points={blackReflectance} id="black" />
