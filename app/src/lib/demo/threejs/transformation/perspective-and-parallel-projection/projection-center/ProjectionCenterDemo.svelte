<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createProjectionCenterScene, type ProjectionCenterParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ProjectionCenterParams = { distance: 2.5, atInfinity: false }
</script>

<ThreeDemoCanvas
  ariaLabel="投影面の手前に置いた立方体と、投影面に写るその像の3次元表示。投影中心を遠ざけるほど投影線が平行に近づき、像が縮まなくなる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createProjectionCenterScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [5, 3.2, 5.5] }}
  orbit={{ target: [0, 0, 0.4], minDistance: 3, maxDistance: 30 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "distance", {
      min: 1.5,
      max: 12,
      step: 0.01,
      label: "投影中心までの距離"
    })
    pane.addBinding(p, "atInfinity", { label: "投影中心を無限遠に置く（平行投影）" })
  }}
/>
