<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createProjectionCameraScene, type ProjectionCameraParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ProjectionCameraParams = { projection: "orthographic" }
</script>

<ThreeDemoCanvas
  ariaLabel="three.jsのPerspectiveCameraとOrthographicCameraの視錐台と、奥行き方向に並べた同じ大きさの立方体3つが近接面に写る像の3次元表示。透視投影では角錐台、平行投影では直方体になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createProjectionCameraScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [6, 3.5, 4] }}
  orbit={{ target: [0, 0, -3.2], minDistance: 4, maxDistance: 24 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "projection", {
      label: "カメラ",
      options: {
        "透視投影（PerspectiveCamera）": "perspective",
        "平行投影（OrthographicCamera）": "orthographic"
      }
    })
  }}
/>
