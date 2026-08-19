<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createImageResolutionScene, type ImageResolutionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // pixelCount は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: ImageResolutionParams = {
    resolution: 24,
    showGrid: false,
    pixelCount: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同じ大きさの画像を、解像度を変えて表示した図。解像度を下げると1つひとつの画素が大きくなり、円や帯の輪郭ががたついて像が粗くなる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createImageResolutionScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.4] }}
  orbit={{ minDistance: 1.5, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "resolution", { min: 2, max: 128, step: 1, label: "解像度（1辺の画素数）" })
    pane.addBinding(p, "showGrid", { label: "画素の境目を表示" })
    pane.addBinding(p, "pixelCount", { readonly: true, label: "画素数" })
  }}
/>
