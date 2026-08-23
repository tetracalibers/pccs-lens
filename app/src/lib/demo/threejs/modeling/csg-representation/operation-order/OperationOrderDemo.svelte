<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createOperationOrderScene, type OperationOrderParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // left・right は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: OperationOrderParams = { operation: "difference", left: "", right: "" }
</script>

<ThreeDemoCanvas
  ariaLabel="同じ球と直方体に集合演算を適用した結果を、順序を入れ替えて左右に並べた3次元表示。左は球に直方体を、右は直方体に球を組み合わせた結果で、和集合と積集合では左右が同じ形、差集合では左右が別の形になる（ドラッグで回転）"
  createScene={createOperationOrderScene}
  {params}
  aspectRatio="2 / 1"
  camera={{ position: [-0.15, 2.03, 4.65] }}
  orbit={{
    target: [-0.15, 0, 0],
    minAzimuthAngle: -Math.PI / 3,
    maxAzimuthAngle: Math.PI / 3,
    minDistance: 3,
    maxDistance: 9
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "operation", {
      label: "集合演算",
      options: { 和集合: "union", 積集合: "intersection", 差集合: "difference" }
    })
    pane.addBinding(p, "left", { readonly: true, label: "左の結果" })
    pane.addBinding(p, "right", { readonly: true, label: "右の結果" })
  }}
/>
