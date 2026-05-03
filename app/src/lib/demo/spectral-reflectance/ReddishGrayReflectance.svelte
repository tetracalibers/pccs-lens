<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 赤みのグレイ：全体的に中程度の反射率で、長波長側がわずかに高い
  const reddishGrayReflectance = [
    { nm: 380, value: 38 },
    { nm: 420, value: 39 },
    { nm: 460, value: 40 },
    { nm: 500, value: 42 },
    { nm: 540, value: 45 },
    { nm: 580, value: 50 },
    { nm: 620, value: 56 },
    { nm: 660, value: 60 },
    { nm: 700, value: 62 },
    { nm: 740, value: 63 },
    { nm: 780, value: 63 }
  ]
</script>

<SpectralReflectanceGraph points={reddishGrayReflectance} id="reddish-gray" />
