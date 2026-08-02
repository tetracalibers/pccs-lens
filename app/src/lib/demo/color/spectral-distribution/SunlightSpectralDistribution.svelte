<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 太陽光（D65 相当）の分光分布
  // 460nm 付近にゆるやかなピークを持ち、長波長側に向けて緩やかに減衰する
  const sunlightSpectrum = [
    { nm: 380, value: 43 },
    { nm: 400, value: 70 },
    { nm: 420, value: 79 },
    { nm: 440, value: 90 },
    { nm: 460, value: 100 },
    { nm: 480, value: 99 },
    { nm: 500, value: 94 },
    { nm: 520, value: 91 },
    { nm: 540, value: 90 },
    { nm: 560, value: 85 },
    { nm: 580, value: 82 },
    { nm: 600, value: 78 },
    { nm: 620, value: 74 },
    { nm: 640, value: 69 },
    { nm: 660, value: 64 },
    { nm: 680, value: 59 },
    { nm: 700, value: 60 },
    { nm: 720, value: 55 },
    { nm: 740, value: 58 },
    { nm: 760, value: 50 },
    { nm: 780, value: 52 }
  ]
</script>

<SpectralDistributionGraph points={sunlightSpectrum} id="sunlight" />
