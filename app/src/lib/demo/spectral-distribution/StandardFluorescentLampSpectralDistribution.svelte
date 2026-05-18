<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 普通型蛍光ランプ（ハロリン酸塩蛍光体、CIE F2 相当）の分光分布
  // 436nm（青）と 546nm（緑）に鋭い水銀輝線のツノが立ち、青ピークが最大
  // 連続成分は黄〜橙にゆるく広がるが、620nm 以降は急激に減衰し、700nm を超えるとほぼゼロ
  const standardFluorescentSpectrum = [
    { nm: 380, value: 2 },
    { nm: 400, value: 6 },
    { nm: 403, value: 9 },
    { nm: 405, value: 45 }, // Hg 405nm 輝線
    { nm: 408, value: 10 },
    { nm: 420, value: 12 },
    { nm: 432, value: 16 },
    { nm: 434, value: 28 },
    { nm: 436, value: 100 }, // Hg 436nm 輝線（最大ピーク・青のツノ）
    { nm: 438, value: 32 },
    { nm: 442, value: 18 },
    { nm: 460, value: 21 },
    { nm: 480, value: 22 },
    { nm: 500, value: 21 },
    { nm: 520, value: 21 },
    { nm: 540, value: 28 },
    { nm: 543, value: 38 },
    { nm: 546, value: 71 }, // Hg 546nm 輝線（緑のツノ）
    { nm: 549, value: 45 },
    { nm: 555, value: 42 },
    { nm: 570, value: 53 },
    { nm: 576, value: 60 },
    { nm: 578, value: 66 }, // Hg 578nm 輝線（黄連続光と重畳）
    { nm: 580, value: 65 },
    { nm: 590, value: 55 },
    { nm: 600, value: 47 },
    { nm: 620, value: 31 },
    { nm: 640, value: 18 },
    { nm: 660, value: 10 },
    { nm: 680, value: 5 },
    { nm: 700, value: 3 },
    { nm: 720, value: 2 },
    { nm: 740, value: 1.5 },
    { nm: 760, value: 1.3 },
    { nm: 780, value: 1 }
  ]
</script>

<SpectralDistributionGraph points={standardFluorescentSpectrum} id="standard-fluorescent" />
