<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPerspectiveProjectionScene, type PerspectiveProjectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PerspectiveProjectionParams = { planeDistance: 1.5 }
</script>

<ThreeDemoCanvas
  ariaLabel="投影中心の前に置いた投影面と、円柱・正方形の板・直方体がその面に写る像の3次元表示。投射線はすべて投影中心の1点に集まり、円は楕円に、板は台形にゆがんで写る（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createPerspectiveProjectionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [6.8, 4, 9] }}
  orbit={{ target: [0, 0, 2.8], minDistance: 3, maxDistance: 24 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "planeDistance", {
      min: 0.8,
      max: 2,
      step: 0.01,
      label: "投影面までの距離"
    })
  }}
/>
