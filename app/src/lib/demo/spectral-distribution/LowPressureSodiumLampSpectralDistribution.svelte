<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 低圧ナトリウムランプの分光分布
  // ナトリウム D 線（589.0nm と 589.6nm の二重項）にエネルギーがほぼ全て集中する
  // 単色光源。他の波長の発光は無視できるほど小さく、平均演色評価数は事実上 0 となる
  const lowPressureSodiumSpectrum = [
    { nm: 380, value: 0 },
    { nm: 420, value: 0 },
    { nm: 460, value: 0 },
    { nm: 500, value: 0 },
    { nm: 540, value: 0 },
    { nm: 570, value: 0 },
    { nm: 583, value: 0 },
    { nm: 586, value: 0 },
    { nm: 587, value: 2 },
    { nm: 588, value: 20 },
    { nm: 589, value: 100 }, // Na D 線（589.0/589.6nm 二重項）
    { nm: 590, value: 20 },
    { nm: 591, value: 2 },
    { nm: 592, value: 0 },
    { nm: 595, value: 0 },
    { nm: 600, value: 0 },
    { nm: 640, value: 0 },
    { nm: 680, value: 0 },
    { nm: 720, value: 0 },
    { nm: 760, value: 0 },
    { nm: 780, value: 0 }
  ]
</script>

<SpectralDistributionGraph points={lowPressureSodiumSpectrum} id="low-pressure-sodium" />
