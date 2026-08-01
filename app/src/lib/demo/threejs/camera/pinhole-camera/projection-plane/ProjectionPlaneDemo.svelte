<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createProjectionPlaneScene, type ProjectionPlaneParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ProjectionPlaneParams = { frontPlane: false, planeDistance: 1.5 }
</script>

<ThreeDemoCanvas
  ariaLabel="ピンホールカメラモデルで被写体の像が投影面に結ばれる様子の3次元表示。投影面を光学中心の後ろに置くと像は反転し、前に置くと被写体と同じ向きになる（ドラッグで回転）"
  createScene={createProjectionPlaneScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [4.5, 3, 6.5] }}
  orbit={{ target: [0, 0, 0.3], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "frontPlane", { label: "投影面を前に置く" })
    pane.addBinding(p, "planeDistance", {
      min: 0.5,
      max: 2.5,
      step: 0.01,
      label: "投影面までの距離"
    })
  }}
/>
