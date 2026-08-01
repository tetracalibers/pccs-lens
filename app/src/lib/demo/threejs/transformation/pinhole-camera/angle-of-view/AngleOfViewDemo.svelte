<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createAngleOfViewScene, type AngleOfViewParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // angleOfView は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: AngleOfViewParams = { focalLength: 1, planeSize: 1, angleOfView: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="ピンホールカメラモデルの画角の3次元表示。光学中心から投影面の4隅を通って伸びる視錐台と、その内側に入って写る立方体・外れて写らない立方体（ドラッグで回転）"
  createScene={createAngleOfViewScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [5.5, 3.5, 7.5] }}
  orbit={{ target: [0, 0, 2.2], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "focalLength", { min: 0.4, max: 2, step: 0.01, label: "焦点距離" })
    pane.addBinding(p, "planeSize", { min: 0.4, max: 1.6, step: 0.01, label: "投影面の大きさ" })
    pane.addBinding(p, "angleOfView", {
      readonly: true,
      format: (value: number) => `${value.toFixed(1)}°`,
      label: "画角"
    })
  }}
/>
