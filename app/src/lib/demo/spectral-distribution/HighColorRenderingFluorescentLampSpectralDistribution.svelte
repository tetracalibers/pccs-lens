<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 高演色型蛍光ランプ（CIE F7 相当・広帯域高演色）の分光分布
  // 普通型と同じく 436nm（青）と 546nm（緑）に水銀輝線のツノが立つが、
  // 赤色蛍光体の追加により 600nm 以降の連続光が大きく持ち上がり、長波長域のエネルギーが増強される
  const highColorRenderingFluorescentSpectrum = [
    { nm: 380, value: 11 },
    { nm: 400, value: 27 },
    { nm: 403, value: 32 },
    { nm: 405, value: 86 }, // Hg 405nm 輝線
    { nm: 408, value: 33 },
    { nm: 420, value: 34 },
    { nm: 432, value: 41 },
    { nm: 434, value: 52 },
    { nm: 436, value: 100 }, // Hg 436nm 輝線（最大ピーク・青のツノ）
    { nm: 438, value: 55 },
    { nm: 442, value: 45 },
    { nm: 460, value: 42 },
    { nm: 480, value: 42 },
    { nm: 500, value: 40 },
    { nm: 520, value: 40 },
    { nm: 540, value: 46 },
    { nm: 543, value: 55 },
    { nm: 546, value: 85 }, // Hg 546nm 輝線（緑のツノ）
    { nm: 549, value: 58 },
    { nm: 560, value: 55 },
    { nm: 570, value: 58 },
    { nm: 576, value: 62 },
    { nm: 578, value: 70 }, // Hg 578nm 輝線
    { nm: 580, value: 60 },
    { nm: 600, value: 55 },
    { nm: 620, value: 53 }, // 赤色蛍光体による底上げ
    { nm: 640, value: 48 },
    { nm: 660, value: 48 },
    { nm: 680, value: 35 },
    { nm: 700, value: 26 },
    { nm: 720, value: 19 },
    { nm: 740, value: 15 },
    { nm: 760, value: 13 },
    { nm: 780, value: 10 }
  ]
</script>

<SpectralDistributionGraph points={highColorRenderingFluorescentSpectrum} id="high-cri-fluorescent" />
