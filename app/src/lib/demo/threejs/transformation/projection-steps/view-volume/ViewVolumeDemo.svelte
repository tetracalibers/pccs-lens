<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createViewVolumeScene, type ViewVolumeParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // fieldOfView は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ViewVolumeParams = {
    projection: "perspective",
    windowSize: 1.6,
    planeDistance: 2,
    near: 1.2,
    far: 5.6,
    fieldOfView: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="投影座標系に組み立てたビューボリュームの3次元表示。投影中心・視線・投影面上のウィンドウ・前方クリッピング面・後方クリッピング面と、ビューボリュームの内側に残る部分だけが明るく描かれた立方体（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createViewVolumeScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [8.5, 4, 5] }}
  orbit={{ target: [0, 0, 3], minDistance: 5, maxDistance: 30 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "projection", {
      label: "投影",
      options: { 透視投影: "perspective", 平行投影: "orthographic" }
    })
    pane.addBinding(p, "windowSize", {
      min: 0.6,
      max: 2.6,
      step: 0.01,
      label: "ウィンドウの大きさ"
    })
    pane.addBinding(p, "planeDistance", {
      min: 0.6,
      max: 4,
      step: 0.01,
      label: "投影面までの距離"
    })
    pane.addBinding(p, "near", { min: 0.4, max: 3, step: 0.01, label: "前方クリッピング面" })
    pane.addBinding(p, "far", { min: 3.2, max: 8, step: 0.01, label: "後方クリッピング面" })
    pane.addBinding(p, "fieldOfView", { readonly: true, label: "視野角" })
  }}
/>
