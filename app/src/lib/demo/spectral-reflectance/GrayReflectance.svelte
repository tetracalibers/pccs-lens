<script lang="ts">
  import SpectralReflectanceGraph from "./SpectralReflectanceGraph.svelte"

  // グレイ：全波長域でほぼ一様に中程度の反射率
  const grayReflectance = [
    { nm: 380, value: 48 },
    { nm: 420, value: 49 },
    { nm: 460, value: 50 },
    { nm: 500, value: 50 },
    { nm: 540, value: 50 },
    { nm: 580, value: 50 },
    { nm: 620, value: 50 },
    { nm: 660, value: 50 },
    { nm: 700, value: 50 },
    { nm: 740, value: 49 },
    { nm: 780, value: 49 }
  ]
</script>

<SpectralReflectanceGraph points={grayReflectance} id="gray" />
