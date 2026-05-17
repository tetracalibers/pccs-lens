<script lang="ts">
  import SpectralDistributionGraph from "./SpectralDistributionGraph.svelte"

  // 3波長域発光型蛍光ランプの分光分布
  // 青（約450nm）・緑（約545nm）・赤（約611nm）の3つの狭いピークが特徴
  // ピーク間のエネルギーは小さく、人の視感度ピークと一致するため発光効率が高い
  const threeBandFluorescentSpectrum = [
    { nm: 380, value: 2 },
    { nm: 400, value: 4 },
    { nm: 420, value: 6 },
    { nm: 440, value: 12 },
    { nm: 447, value: 55 },
    { nm: 450, value: 92 }, // 青ピーク
    { nm: 453, value: 55 },
    { nm: 460, value: 15 },
    { nm: 480, value: 6 },
    { nm: 500, value: 5 },
    { nm: 520, value: 8 },
    { nm: 540, value: 35 },
    { nm: 544, value: 75 },
    { nm: 546, value: 95 }, // 緑ピーク（水銀輝線と重畳）
    { nm: 548, value: 75 },
    { nm: 552, value: 30 },
    { nm: 570, value: 8 },
    { nm: 590, value: 12 },
    { nm: 605, value: 60 },
    { nm: 611, value: 100 }, // 赤ピーク
    { nm: 617, value: 55 },
    { nm: 630, value: 12 },
    { nm: 650, value: 6 },
    { nm: 680, value: 4 },
    { nm: 710, value: 3 },
    { nm: 740, value: 2 },
    { nm: 780, value: 2 }
  ]
</script>

<SpectralDistributionGraph points={threeBandFluorescentSpectrum} id="three-band-fluorescent" />
