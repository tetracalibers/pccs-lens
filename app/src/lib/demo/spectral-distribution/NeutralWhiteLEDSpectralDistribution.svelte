<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 昼白色 LED（相関色温度約 5000K）の分光分布
  // 青色 LED チップの 445nm 付近の鋭いピーク（最大）と、黄色蛍光体による
  // 555nm 付近の広いピークがほぼ拮抗する。両ピーク間に「シアンの谷」と呼ばれる凹みがある
  const neutralWhiteLEDSpectrum = [
    { nm: 380, value: 0 },
    { nm: 400, value: 1 },
    { nm: 420, value: 5 },
    { nm: 430, value: 18 },
    { nm: 440, value: 60 },
    { nm: 445, value: 100 }, // 青色 LED ピーク（最大）
    { nm: 450, value: 85 },
    { nm: 455, value: 45 },
    { nm: 460, value: 25 },
    { nm: 470, value: 17 },
    { nm: 478, value: 20 }, // シアンの谷
    { nm: 485, value: 28 },
    { nm: 492, value: 40 },
    { nm: 500, value: 52 },
    { nm: 510, value: 65 },
    { nm: 520, value: 74 },
    { nm: 530, value: 80 },
    { nm: 540, value: 83 },
    { nm: 550, value: 84 },
    { nm: 555, value: 84 }, // 蛍光体ピーク
    { nm: 560, value: 83 },
    { nm: 570, value: 79 },
    { nm: 580, value: 73 },
    { nm: 590, value: 65 },
    { nm: 600, value: 56 },
    { nm: 620, value: 42 },
    { nm: 640, value: 28 },
    { nm: 660, value: 18 },
    { nm: 680, value: 11 },
    { nm: 700, value: 7 },
    { nm: 720, value: 4 },
    { nm: 740, value: 3 },
    { nm: 760, value: 2 },
    { nm: 780, value: 1 }
  ]
</script>

<SpectralDistributionGraph points={neutralWhiteLEDSpectrum} id="neutral-white-led" />
