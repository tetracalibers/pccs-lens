<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 白熱電球（CIE 標準光源 A 相当, 色温度約 2856K）の分光分布
  // 短波長側は弱く、長波長側に向けて単調に増加する
  const incandescentSpectrum = [
    { nm: 380, value: 5 },
    { nm: 400, value: 8 },
    { nm: 420, value: 11 },
    { nm: 440, value: 14 },
    { nm: 460, value: 18 },
    { nm: 480, value: 23 },
    { nm: 500, value: 28 },
    { nm: 520, value: 33 },
    { nm: 540, value: 39 },
    { nm: 560, value: 46 },
    { nm: 580, value: 52 },
    { nm: 600, value: 58 },
    { nm: 620, value: 64 },
    { nm: 640, value: 70 },
    { nm: 660, value: 75 },
    { nm: 680, value: 80 },
    { nm: 700, value: 85 },
    { nm: 720, value: 89 },
    { nm: 740, value: 93 },
    { nm: 760, value: 97 },
    { nm: 780, value: 100 }
  ]
</script>

<SpectralDistributionGraph points={incandescentSpectrum} id="incandescent" />
