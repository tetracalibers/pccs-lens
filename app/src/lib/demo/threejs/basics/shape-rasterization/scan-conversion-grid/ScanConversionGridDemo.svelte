<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createScanConversionGridScene, type ScanConversionGridParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ScanConversionGridParams = {
    slope: 0.45,
    columns: 24,
    showLine: true
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画像座標系の画素格子に、連続な直線と、その直線に最も近い画素を塗った結果を重ねた図。画素を粗くするほど、塗られた画素の並びが階段状にがたつく（ホイールで拡大縮小）"
  createScene={createScanConversionGridScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.3] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "slope", { min: -1, max: 1, step: 0.01, label: "直線の傾き" })
    pane.addBinding(p, "columns", { min: 9, max: 42, step: 3, label: "横の画素数" })
    pane.addBinding(p, "showLine", { label: "連続な直線を表示" })
  }}
/>
