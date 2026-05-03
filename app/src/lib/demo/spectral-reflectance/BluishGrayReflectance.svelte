<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // 青みのグレイ：全体的に中程度の反射率で、短波長側がわずかに高い
  const bluishGrayReflectance = [
    { nm: 380, value: 63 },
    { nm: 420, value: 63 },
    { nm: 460, value: 62 },
    { nm: 500, value: 58 },
    { nm: 540, value: 52 },
    { nm: 580, value: 47 },
    { nm: 620, value: 43 },
    { nm: 660, value: 40 },
    { nm: 700, value: 39 },
    { nm: 740, value: 38 },
    { nm: 780, value: 38 }
  ]
</script>

<SpectralReflectanceGraph points={bluishGrayReflectance} id="bluish-gray" />
