<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 3波長域発光型蛍光ランプ（CIE F11 相当、TL84、4000K）の分光分布
  // 青（約440nm）・緑（約548nm）・赤（約613nm）の3つの狭いピークが特徴で、最大ピークは赤
  // ピーク間は極めて低く、人の視感度ピークに合わせることで高い発光効率と演色性を両立する
  const threeBandFluorescentSpectrum = [
    { nm: 380, value: 1 },
    { nm: 400, value: 2 },
    { nm: 403, value: 4 },
    { nm: 405, value: 32 }, // Hg 405nm 紫の小輝線
    { nm: 408, value: 4 },
    { nm: 420, value: 2 },
    { nm: 432, value: 3 },
    { nm: 436, value: 18 }, // Hg 436nm
    { nm: 438, value: 35 },
    { nm: 440, value: 55 }, // 青ピーク（青蛍光体）
    { nm: 443, value: 50 },
    { nm: 447, value: 32 },
    { nm: 452, value: 15 },
    { nm: 460, value: 5 },
    { nm: 480, value: 2 },
    { nm: 500, value: 2 },
    { nm: 520, value: 2 },
    { nm: 540, value: 3 },
    { nm: 544, value: 25 },
    { nm: 546, value: 50 }, // Hg 546nm
    { nm: 548, value: 68 }, // 緑ピーク（緑蛍光体）
    { nm: 551, value: 60 },
    { nm: 555, value: 32 },
    { nm: 560, value: 10 },
    { nm: 570, value: 3 },
    { nm: 585, value: 1 },
    { nm: 600, value: 2 },
    { nm: 606, value: 14 },
    { nm: 609, value: 45 },
    { nm: 612, value: 85 },
    { nm: 613, value: 100 }, // 赤ピーク（赤蛍光体・最大）
    { nm: 615, value: 90 },
    { nm: 618, value: 55 },
    { nm: 622, value: 22 },
    { nm: 628, value: 7 },
    { nm: 640, value: 2 },
    { nm: 660, value: 1 },
    { nm: 680, value: 1 },
    { nm: 700, value: 1 },
    { nm: 720, value: 1 },
    { nm: 740, value: 1 },
    { nm: 760, value: 1 },
    { nm: 780, value: 1 }
  ]
</script>

<SpectralDistributionGraph points={threeBandFluorescentSpectrum} id="three-band-fluorescent" />
