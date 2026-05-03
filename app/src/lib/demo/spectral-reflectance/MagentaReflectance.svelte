<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // マゼンタ：短波長域と長波長域で高い反射率、中波長域（緑）を吸収
  const magentaReflectance = [
    { nm: 380, value: 60 },
    { nm: 410, value: 72 },
    { nm: 440, value: 80 },
    { nm: 470, value: 78 },
    { nm: 500, value: 60 },
    { nm: 530, value: 28 },
    { nm: 550, value: 15 },
    { nm: 570, value: 14 },
    { nm: 590, value: 22 },
    { nm: 610, value: 50 },
    { nm: 640, value: 75 },
    { nm: 680, value: 86 },
    { nm: 720, value: 88 },
    { nm: 780, value: 88 }
  ]
</script>

<SpectralReflectanceGraph points={magentaReflectance} id="magenta" />
