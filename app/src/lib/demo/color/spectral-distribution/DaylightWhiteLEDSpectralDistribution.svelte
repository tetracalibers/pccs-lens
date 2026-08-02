<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 昼光色 LED（相関色温度約 6500K）の分光分布
  // 青色 LED チップの 445nm 付近のピークが非常に強く、黄色蛍光体ピークは相対的に小さい
  // 475nm 付近に明確なシアンの谷ができ、長波長側は緩やかに減衰する
  const daylightWhiteLEDSpectrum = [
    { nm: 380, value: 0 },
    { nm: 400, value: 1 },
    { nm: 420, value: 8 },
    { nm: 430, value: 28 },
    { nm: 440, value: 75 },
    { nm: 445, value: 100 }, // 青色 LED ピーク（最大）
    { nm: 450, value: 90 },
    { nm: 455, value: 55 },
    { nm: 460, value: 28 },
    { nm: 470, value: 14 },
    { nm: 475, value: 12 }, // シアンの谷（最深部）
    { nm: 482, value: 14 },
    { nm: 490, value: 22 },
    { nm: 500, value: 32 },
    { nm: 510, value: 44 },
    { nm: 520, value: 52 },
    { nm: 530, value: 58 },
    { nm: 540, value: 62 },
    { nm: 550, value: 64 }, // 蛍光体ピーク
    { nm: 560, value: 62 },
    { nm: 570, value: 58 },
    { nm: 580, value: 53 },
    { nm: 590, value: 47 },
    { nm: 600, value: 41 },
    { nm: 620, value: 30 },
    { nm: 640, value: 20 },
    { nm: 660, value: 13 },
    { nm: 680, value: 8 },
    { nm: 700, value: 5 },
    { nm: 720, value: 3 },
    { nm: 740, value: 2 },
    { nm: 760, value: 1 },
    { nm: 780, value: 1 }
  ]
</script>

<SpectralDistributionGraph points={daylightWhiteLEDSpectrum} id="daylight-white-led" />
