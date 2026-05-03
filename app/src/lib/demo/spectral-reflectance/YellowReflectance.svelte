<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 黄：中〜長波長域で高い反射率、短波長域（青）を吸収
  const yellowReflectance = [
    { nm: 380, value: 5 },
    { nm: 420, value: 6 },
    { nm: 450, value: 7 },
    { nm: 480, value: 12 },
    { nm: 500, value: 30 },
    { nm: 520, value: 65 },
    { nm: 540, value: 85 },
    { nm: 570, value: 90 },
    { nm: 600, value: 92 },
    { nm: 640, value: 92 },
    { nm: 680, value: 92 },
    { nm: 720, value: 92 },
    { nm: 780, value: 92 }
  ]
</script>

<SpectralReflectanceGraph points={yellowReflectance} id="yellow" />
