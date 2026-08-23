<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSetOperationsScene, type SetOperationsParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SetOperationsParams = { operation: "union" }
</script>

<ThreeDemoCanvas
  ariaLabel="直方体の角をくわえこむ位置に置いた球と直方体に、集合演算を適用した結果の3次元表示。手前を向いた頂点の右奥の角に球がある。和集合では球が角から膨らんだ形、積集合では重なっている角の一帯だけ、差集合では一方が他方に削り取られた形になる（ドラッグで回転）"
  createScene={createSetOperationsScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [-3.15, 2.25, 3.15] }}
  orbit={{ target: [0.3, 0.3, 0.3] }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "operation", {
      label: "集合演算",
      options: {
        和集合: "union",
        積集合: "intersection",
        "差集合（直方体−球）": "boxMinusSphere",
        "差集合（球−直方体）": "sphereMinusBox"
      }
    })
  }}
/>
