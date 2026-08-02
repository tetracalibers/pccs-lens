<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // ハロゲン電球（色温度約 3000K、IRカット加工あり）の分光分布
  // 黒体放射に近い形で短波長側から増加するが、多くの製品は赤外線（および近赤外）
  // をカットする加工が施されているため、700nm 付近をピークに長波長側へ急減する
  const halogenSpectrum = [
    { nm: 380, value: 8 },
    { nm: 400, value: 12 },
    { nm: 420, value: 17 },
    { nm: 440, value: 23 },
    { nm: 460, value: 30 },
    { nm: 480, value: 37 },
    { nm: 500, value: 45 },
    { nm: 520, value: 53 },
    { nm: 540, value: 61 },
    { nm: 560, value: 69 },
    { nm: 580, value: 76 },
    { nm: 600, value: 83 },
    { nm: 620, value: 89 },
    { nm: 640, value: 94 },
    { nm: 660, value: 98 },
    { nm: 680, value: 100 },
    { nm: 700, value: 99 },
    { nm: 720, value: 88 },
    { nm: 740, value: 65 },
    { nm: 760, value: 38 },
    { nm: 780, value: 18 }
  ]
</script>

<SpectralDistributionGraph points={halogenSpectrum} id="halogen" />
