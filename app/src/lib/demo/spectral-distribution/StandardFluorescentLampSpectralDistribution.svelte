<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 普通型蛍光ランプ（ハロリン酸塩蛍光体）の分光分布
  // 黄色寄りの連続スペクトルに、水銀の輝線（405, 436, 546, 578nm）が重なる
  // 578nm 付近のピークが最も大きく、全体に黄〜橙寄りになる
  const standardFluorescentSpectrum = [
    { nm: 380, value: 3 },
    { nm: 400, value: 8 },
    { nm: 403, value: 12 },
    { nm: 405, value: 72 }, // Hg 405nm 輝線
    { nm: 407, value: 12 },
    { nm: 420, value: 17 },
    { nm: 434, value: 24 },
    { nm: 436, value: 62 }, // Hg 436nm 輝線
    { nm: 438, value: 24 },
    { nm: 460, value: 30 },
    { nm: 480, value: 36 },
    { nm: 500, value: 40 },
    { nm: 520, value: 46 },
    { nm: 540, value: 55 },
    { nm: 544, value: 60 },
    { nm: 546, value: 90 }, // Hg 546nm 輝線
    { nm: 548, value: 62 },
    { nm: 560, value: 70 },
    { nm: 576, value: 78 },
    { nm: 578, value: 100 }, // Hg 578nm 輝線（最大ピーク）
    { nm: 580, value: 80 },
    { nm: 600, value: 72 },
    { nm: 620, value: 62 },
    { nm: 640, value: 50 },
    { nm: 660, value: 40 },
    { nm: 680, value: 30 },
    { nm: 700, value: 22 },
    { nm: 720, value: 16 },
    { nm: 740, value: 12 },
    { nm: 760, value: 9 },
    { nm: 780, value: 7 }
  ]
</script>

<SpectralDistributionGraph points={standardFluorescentSpectrum} id="standard-fluorescent" />
