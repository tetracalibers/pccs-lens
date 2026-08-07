<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPipelineStagesScene, type PipelineStagesParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PipelineStagesParams = { stage: "modeling" }
</script>

<ThreeDemoCanvas
  ariaLabel="ビューイングパイプラインが経由する座標系の3次元表示。モデリング座標系・ワールド座標系・カメラ座標系・投影座標系・正規化デバイス座標系を切り替えると、家型の物体とカメラが写す範囲が、その座標系での位置に置き直される（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createPipelineStagesScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [4.4, 3, 5.8] }}
  orbit={{ target: [0, 0.2, -0.3], minDistance: 3, maxDistance: 24 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "stage", {
      label: "座標系",
      options: {
        モデリング座標系: "modeling",
        ワールド座標系: "world",
        カメラ座標系: "camera",
        投影座標系: "projection",
        正規化デバイス座標系: "ndc"
      }
    })
  }}
/>
