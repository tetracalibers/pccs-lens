<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // シアン：短〜中波長域で高い反射率、長波長域（赤）を吸収
  const cyanReflectance = [
    { nm: 380, value: 55 },
    { nm: 410, value: 68 },
    { nm: 440, value: 78 },
    { nm: 470, value: 82 },
    { nm: 500, value: 82 },
    { nm: 530, value: 78 },
    { nm: 560, value: 68 },
    { nm: 590, value: 45 },
    { nm: 610, value: 22 },
    { nm: 640, value: 10 },
    { nm: 680, value: 6 },
    { nm: 720, value: 5 },
    { nm: 780, value: 5 }
  ]
</script>

<SpectralReflectanceGraph points={cyanReflectance} id="cyan" />
