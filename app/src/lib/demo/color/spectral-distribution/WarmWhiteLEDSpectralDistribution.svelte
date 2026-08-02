<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 電球色 LED（相関色温度約 2700〜3000K）の分光分布
  // 青色 LED チップの 450nm 付近のピークは小さく、黄〜赤蛍光体による
  // 570〜600nm 付近の広いピークが最大となる。赤蛍光体の寄与で長波長側もよく伸びる
  const warmWhiteLEDSpectrum = [
    { nm: 380, value: 0 },
    { nm: 400, value: 1 },
    { nm: 420, value: 3 },
    { nm: 430, value: 8 },
    { nm: 440, value: 22 },
    { nm: 445, value: 38 },
    { nm: 450, value: 42 }, // 青色 LED ピーク（控えめ）
    { nm: 455, value: 30 },
    { nm: 460, value: 20 },
    { nm: 470, value: 18 },
    { nm: 480, value: 25 },
    { nm: 490, value: 38 },
    { nm: 500, value: 52 },
    { nm: 510, value: 68 },
    { nm: 520, value: 80 },
    { nm: 530, value: 88 },
    { nm: 540, value: 93 },
    { nm: 550, value: 96 },
    { nm: 560, value: 98 },
    { nm: 570, value: 100 }, // 蛍光体ピーク（最大）
    { nm: 580, value: 99 },
    { nm: 590, value: 95 },
    { nm: 600, value: 88 },
    { nm: 610, value: 80 },
    { nm: 620, value: 70 },
    { nm: 640, value: 50 },
    { nm: 660, value: 34 },
    { nm: 680, value: 22 },
    { nm: 700, value: 14 },
    { nm: 720, value: 9 },
    { nm: 740, value: 5 },
    { nm: 760, value: 3 },
    { nm: 780, value: 2 }
  ]
</script>

<SpectralDistributionGraph points={warmWhiteLEDSpectrum} id="warm-white-led" />
