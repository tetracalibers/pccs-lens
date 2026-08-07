<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createStageTransitionScene, type StageTransitionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: StageTransitionParams = { step: "modeling", progress: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="ビューイングパイプラインの変換を1つずつ見る3次元表示。変換を選び進み具合を動かすと、家型の物体3体とカメラが写す範囲が、変換前の座標系での位置から変換後の座標系での位置へ連続的に移っていく（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createStageTransitionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [4.4, 3, 5.8] }}
  orbit={{ target: [0, 0.2, -0.3], minDistance: 3, maxDistance: 24 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "step", {
      label: "変換",
      options: {
        モデリング変換: "modeling",
        視野変換: "view",
        "z軸の反転": "zFlip",
        投影変換: "projection"
      }
    })
    pane.addBinding(p, "progress", { min: 0, max: 1, step: 0.01, label: "進み具合" })
  }}
/>
