<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 高演色型蛍光ランプの分光分布
  // 複数の蛍光体を組み合わせて可視域全体をなだらかに覆い、太陽光に近い連続スペクトルを実現する
  // 水銀の輝線は残るが、連続成分が大きいためピークの突出は小さい
  const highColorRenderingFluorescentSpectrum = [
    { nm: 380, value: 12 },
    { nm: 400, value: 22 },
    { nm: 403, value: 28 },
    { nm: 405, value: 58 }, // Hg 405nm 輝線（控えめ）
    { nm: 408, value: 30 },
    { nm: 420, value: 40 },
    { nm: 434, value: 50 },
    { nm: 436, value: 68 }, // Hg 436nm 輝線（控えめ）
    { nm: 438, value: 52 },
    { nm: 460, value: 62 },
    { nm: 480, value: 68 },
    { nm: 500, value: 72 },
    { nm: 520, value: 75 },
    { nm: 540, value: 78 },
    { nm: 544, value: 80 },
    { nm: 546, value: 92 }, // Hg 546nm 輝線
    { nm: 548, value: 82 },
    { nm: 560, value: 82 },
    { nm: 576, value: 84 },
    { nm: 578, value: 95 }, // Hg 578nm 輝線
    { nm: 580, value: 86 },
    { nm: 600, value: 82 },
    { nm: 620, value: 76 },
    { nm: 640, value: 68 },
    { nm: 660, value: 58 },
    { nm: 680, value: 48 },
    { nm: 700, value: 38 },
    { nm: 720, value: 30 },
    { nm: 740, value: 24 },
    { nm: 760, value: 19 },
    { nm: 780, value: 15 }
  ]
</script>

<SpectralDistributionGraph points={highColorRenderingFluorescentSpectrum} id="high-cri-fluorescent" />
